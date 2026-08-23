import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { billingLedger, professionals, stripeEventReceipts } from '@/lib/db/schema'
import { retentionDeadline } from '@/lib/legal-audit'

function activeTier(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing'
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const value = invoice.parent?.subscription_details?.subscription
  return typeof value === 'string' ? value : value?.id ?? null
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'A webhook aláírás-ellenőrzése nincs beállítva.' }, { status: 503 })
  }
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Hiányzik a webhook aláírása.' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Érvénytelen webhook-kérelem.' }, { status: 400 })
  }

  try {
    await db.transaction(async (tx) => {
      const inserted = await tx.insert(stripeEventReceipts).values({ eventId: event.id, eventType: event.type }).onConflictDoNothing().returning({ id: stripeEventReceipts.eventId })
      if (!inserted.length) return

      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const checkout = event.data.object
        if (checkout.payment_status === 'paid' || checkout.payment_status === 'no_payment_required') {
          const professionalId = Number(checkout.metadata?.professionalId || checkout.client_reference_id)
          if (professionalId && checkout.metadata?.product === 'FEATURED') {
            await tx.update(professionals).set({
              membershipTier: 'FEATURED', featuredBillingInterval: checkout.metadata.interval || null,
              stripeSessionId: checkout.id, stripeCustomerId: String(checkout.customer || ''),
              stripeSubscriptionId: String(checkout.subscription || ''),
              // Checkout completed — the registration is now a real, paid/trialing
              // account and may appear in the admin pending-review list.
              paymentStatus: 'trial_active', updatedAt: new Date(),
            }).where(eq(professionals.id, professionalId))
          }
        }
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        if (subscription.metadata?.product === 'FEATURED') {
          const featured = event.type !== 'customer.subscription.deleted' && activeTier(subscription.status)
          const professionalId = Number(subscription.metadata.professionalId)
          await tx.update(professionals).set({
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
            stripeTrialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            // A live/trialing subscription confirms a completed checkout, so the
            // record is safe to surface to admins even if the checkout.session
            // event was missed.
            paymentStatus: featured ? 'trial_active' : undefined,
            membershipTier: featured ? 'FEATURED' : 'FREE',
            featuredBillingInterval: featured ? subscription.metadata.interval || null : null,
            featuredUntil: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000) : null,
            updatedAt: new Date(),
          }).where(professionalId ? eq(professionals.id, professionalId) : eq(professionals.stripeSubscriptionId, subscription.id))
        }
      }

      if (event.type === 'invoice.finalized' || event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
        const invoice = event.data.object
        const subscriptionId = subscriptionIdFromInvoice(invoice)
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null
        const [owner] = subscriptionId
          ? await tx.select({ id: professionals.id }).from(professionals).where(eq(professionals.stripeSubscriptionId, subscriptionId)).limit(1)
          : []
        const invoiceDate = new Date(invoice.created * 1000)
        await tx.insert(billingLedger).values({
          professionalId: owner?.id ?? null, stripeCustomerId: customerId, stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId, amountDue: invoice.amount_due, amountPaid: invoice.amount_paid,
          taxAmount: invoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0,
          currency: invoice.currency, status: invoice.status ?? 'unknown', invoiceNumber: invoice.number,
          invoiceDate, hostedInvoiceUrl: invoice.hosted_invoice_url, invoicePdfUrl: invoice.invoice_pdf,
          retainUntil: retentionDeadline(invoiceDate),
        }).onConflictDoUpdate({ target: billingLedger.stripeInvoiceId, set: {
          amountDue: invoice.amount_due, amountPaid: invoice.amount_paid,
          taxAmount: invoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0,
          status: invoice.status ?? 'unknown', invoiceNumber: invoice.number,
          hostedInvoiceUrl: invoice.hosted_invoice_url, invoicePdfUrl: invoice.invoice_pdf,
        } })
        if (event.type === 'invoice.payment_failed' && subscriptionId) {
          await tx.update(professionals).set({ stripeSubscriptionStatus: 'past_due', updatedAt: new Date() }).where(eq(professionals.stripeSubscriptionId, subscriptionId))
        }
      }
    })
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'A webhook feldolgozása sikertelen.' }, { status: 500 })
  }
}
