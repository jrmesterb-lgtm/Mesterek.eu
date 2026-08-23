'use server'

import { randomBytes } from 'node:crypto'
import { del, put } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { z } from 'zod'
import { getAppOrigin } from '@/lib/app-origin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, billingLedger, contractorInquiries, legalConsentEvents, phoneLeadEvents, professionalPortfolioImages, professionalReviews, professionals, session, twoFactor, user } from '@/lib/db/schema'
import { LEGAL_TERMS_HASH, LEGAL_TERMS_VERSION, legalRequestMetadata } from '@/lib/legal-audit'
import { requireProfessional } from '@/lib/professional-auth'
import { hasBlacklistedContractorKeyword } from '@/lib/contractor-quality'
import { hasActivePremium } from '@/lib/premium'
import { profileSchema, type ProfileActionState } from '@/lib/profile-schema'

async function requiredProfessional() { return (await requireProfessional()).professional }

export async function setProfessionalAvailability(isAvailable: boolean) {
  const professional = await requiredProfessional()
  if (typeof isAvailable !== 'boolean') return { success: false as const, message: 'Érvénytelen elérhetőségi állapot.' }

  const [updated] = await db.update(professionals)
    .set({ isAvailable, availabilityExplicitlySet: true, updatedAt: new Date() })
    .where(and(eq(professionals.id, professional.id), eq(professionals.userId, professional.userId!)))
    .returning({ id: professionals.id })

  if (!updated) return { success: false as const, message: 'Az állapot frissítése nem sikerült.' }
  revalidatePath('/dashboard')
  revalidatePath('/kereses')
  revalidatePath(`/szakemberek/${professional.id}`)
  return { success: true as const }
}

export async function updateProfile(_previousState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const professional = await requiredProfessional()
  const featured = hasActivePremium(professional)
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Néhány mezőt javítani kell a mentés előtt.', errors: parsed.error.flatten().fieldErrors }
  }

  const values = parsed.data
  const updatedAt = new Date()
  try {
    const legalMetadata = await legalRequestMetadata()
    await db.transaction(async (tx) => {
      await tx.update(professionals).set({
        name: values.name,
        billingName: values.billingName,
        email: values.email,
        phone: values.phone,
        profession: values.profession,
        description: values.description,
        isEmergency247: values.isEmergency247,
        extendedBio: featured ? values.extendedBio || null : professional.extendedBio,
        whatsappPhone: featured ? values.whatsappPhone || null : professional.whatsappPhone,
        viberPhone: featured ? values.viberPhone || null : professional.viberPhone,
        status: hasBlacklistedContractorKeyword(values.name, values.profession) ? 'PENDING_REVIEW' : professional.status,
        updatedAt,
      }).where(and(eq(professionals.id, professional.id), eq(professionals.userId, professional.userId!)))
      await tx.update(user).set({ name: values.name, email: values.email, updatedAt }).where(eq(user.id, professional.userId!))
      await tx.insert(legalConsentEvents).values({
        userId: professional.userId,
        professionalId: professional.id,
        eventType: 'PROFILE_UPDATED_UNDER_TERMS',
        termsVersion: LEGAL_TERMS_VERSION,
        termsHash: LEGAL_TERMS_HASH,
        acceptedAt: updatedAt,
        ipAddress: legalMetadata.ipAddress,
        userAgent: legalMetadata.userAgent,
      })
    })
  } catch {
    return { status: 'error', message: 'A profil mentése nem sikerült. Lehet, hogy az e-mail-cím már használatban van.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/kereses')
  revalidatePath('/')
  return { status: 'success', message: 'A profil adatai frissültek.' }
}

const CHECKOUT_PLANS = {
  month: { lookupKey: 'kiemelt_mester_monthly', amount: 499000, interval: 'month' },
  year: { lookupKey: 'kiemelt_mester_yearly', amount: 4999000, interval: 'year' },
} as const

const checkoutInputSchema = z.object({
  interval: z.enum(['month', 'year']),
  attemptId: z.string().uuid(),
})

export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; message: string }

export async function startFeaturedCheckout(interval: 'month' | 'year', attemptId: string): Promise<CheckoutResult> {
  const input = checkoutInputSchema.safeParse({ interval, attemptId })
  if (!input.success) return { success: false, message: 'Érvénytelen előfizetési csomag.' }
  if (!process.env.STRIPE_SECRET_KEY) return { success: false, message: 'A fizetés jelenleg nem indítható.' }

  const professional = await requiredProfessional()
  const plan = CHECKOUT_PLANS[input.data.interval]
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    const prices = await stripe.prices.list({
      active: true,
      lookup_keys: [plan.lookupKey],
      limit: 1,
    })
    const price = prices.data[0]
    if (
      !price ||
      price.currency !== 'huf' ||
      price.unit_amount !== plan.amount ||
      price.type !== 'recurring' ||
      price.recurring?.interval !== plan.interval
    ) {
      return { success: false, message: 'A kiválasztott csomag jelenleg nem érhető el.' }
    }

    const origin = getAppOrigin()
    const checkoutSession = await stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      locale: 'hu',
      mode: 'subscription',
      integration_identifier: `featured_${randomBytes(4).toString('hex')}`,
      customer: professional.stripeCustomerId || undefined,
      customer_email: professional.stripeCustomerId ? undefined : professional.email || undefined,
      success_url: `${origin}/dashboard?siker=1`,
      cancel_url: `${origin}/dashboard?megszakitva=1`,
      client_reference_id: String(professional.id),
      metadata: { professionalId: String(professional.id), product: 'FEATURED', interval: input.data.interval },
      subscription_data: { metadata: { professionalId: String(professional.id), product: 'FEATURED', interval: input.data.interval } },
      line_items: [{ quantity: 1, price: price.id }],
    }, { idempotencyKey: `featured:${professional.id}:${input.data.interval}:${input.data.attemptId}` })

    if (!checkoutSession.url) return { success: false, message: 'A Stripe fizetési oldal nem érhető el.' }
    return { success: true, url: checkoutSession.url }
  } catch {
    return { success: false, message: 'A fizetés indítása nem sikerült. Próbálja újra.' }
  }
}

export async function openBillingPortal() { const professional = await requiredProfessional(); if (!professional.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) throw new Error('Nincs kezelhető előfizetés.'); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); const portal = await stripe.billingPortal.sessions.create({ customer: professional.stripeCustomerId, return_url: `${getAppOrigin()}/dashboard` }); redirect(portal.url) }
export async function uploadPortfolioImage(formData: FormData) { const professional = await requiredProfessional(); if (!hasActivePremium(professional)) throw new Error('A portfólió csak aktív kiemelt jogosultsággal használható.'); const file = formData.get('file'); if (!(file instanceof File) || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('JPEG, PNG vagy WebP kép tölthető fel, legfeljebb 5 MB méretben.'); const gallery = await db.select().from(professionalPortfolioImages).where(eq(professionalPortfolioImages.professionalId, professional.id)); if (gallery.length >= 6) throw new Error('Legfeljebb 6 portfóliókép tölthető fel.'); const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'; const blob = await put(`portfolios/${professional.id}/${randomBytes(16).toString('hex')}.${extension}`, file, { access: 'private', contentType: file.type }); await db.insert(professionalPortfolioImages).values({ professionalId: professional.id, blobPathname: blob.pathname, altText: `${professional.name} munkája`, sortOrder: gallery.length }); revalidatePath('/dashboard') }
export async function deletePortfolioImage(formData: FormData) { const professional = await requiredProfessional(); const id = z.coerce.number().int().positive().parse(formData.get('imageId')); const [image] = await db.select().from(professionalPortfolioImages).where(and(eq(professionalPortfolioImages.id, id), eq(professionalPortfolioImages.professionalId, professional.id))).limit(1); if (!image) throw new Error('A kép nem található.'); await del(image.blobPathname); await db.delete(professionalPortfolioImages).where(and(eq(professionalPortfolioImages.id, id), eq(professionalPortfolioImages.professionalId, professional.id))); revalidatePath('/dashboard') }
export type DeleteAccountState = { status: 'idle' | 'error'; message?: string }

export async function deleteProfessionalAccount(_state: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const { session: currentSession, professional } = await requireProfessional()
  const confirmation = z.string().trim().safeParse(formData.get('confirmation'))
  const acknowledged = formData.get('acknowledged') === 'on'
  if (!confirmation.success || confirmation.data !== 'FIÓK TÖRLÉSE' || !acknowledged) {
    return { status: 'error', message: 'Írja be pontosan: FIÓK TÖRLÉSE, és jelölje be a megerősítést.' }
  }

  if (professional.stripeSubscriptionId) {
    if (!process.env.STRIPE_SECRET_KEY) return { status: 'error', message: 'Az aktív előfizetés lemondása most nem ellenőrizhető.' }
    try {
      await new Stripe(process.env.STRIPE_SECRET_KEY).subscriptions.cancel(professional.stripeSubscriptionId)
    } catch {
      return { status: 'error', message: 'Az előfizetés lemondása nem sikerült, ezért a fiókot nem töröltük.' }
    }
  }

  const gallery = await db.select({ pathname: professionalPortfolioImages.blobPathname }).from(professionalPortfolioImages)
    .where(eq(professionalPortfolioImages.professionalId, professional.id))
  try {
    await Promise.all(gallery.map((image) => del(image.pathname)))
  } catch {
    return { status: 'error', message: 'A feltöltött fájlok törlése nem sikerült. A fiók változatlan maradt.' }
  }

  const erasedAt = new Date()
  const legalMetadata = await legalRequestMetadata()
  await db.transaction(async (tx) => {
    await tx.delete(professionalPortfolioImages).where(eq(professionalPortfolioImages.professionalId, professional.id))
    await tx.delete(phoneLeadEvents).where(eq(phoneLeadEvents.professionalId, professional.id))
    await tx.delete(professionalReviews).where(eq(professionalReviews.professionalId, professional.id))
    await tx.delete(contractorInquiries).where(eq(contractorInquiries.professionalId, professional.id))
    await tx.update(billingLedger).set({ professionalId: null }).where(eq(billingLedger.professionalId, professional.id))
    await tx.update(legalConsentEvents).set({ userId: null, professionalId: null, ipAddress: null, userAgent: null, anonymizedAt: erasedAt })
      .where(eq(legalConsentEvents.professionalId, professional.id))
    await tx.insert(legalConsentEvents).values({ eventType: 'ACCOUNT_ERASURE_COMPLETED', termsVersion: LEGAL_TERMS_VERSION, termsHash: LEGAL_TERMS_HASH, acceptedAt: erasedAt, ipAddress: null, userAgent: legalMetadata.userAgent ? 'recorded-and-redacted' : null, anonymizedAt: erasedAt })
    await tx.delete(professionals).where(and(eq(professionals.id, professional.id), eq(professionals.userId, currentSession.user.id)))
    await tx.delete(twoFactor).where(eq(twoFactor.userId, currentSession.user.id))
    await tx.delete(account).where(eq(account.userId, currentSession.user.id))
    await tx.delete(session).where(eq(session.userId, currentSession.user.id))
    await tx.delete(user).where(eq(user.id, currentSession.user.id))
  })
  redirect('/?fiok-torolve=1')
}

export async function logoutDashboard() { await auth.api.signOut({ headers: await headers() }); redirect('/') }
