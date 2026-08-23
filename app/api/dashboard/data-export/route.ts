import { and, asc, count, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  billingLedger,
  legalConsentEvents,
  phoneLeadEvents,
  professionalPortfolioImages,
  professionals,
  user,
} from '@/lib/db/schema'
import { requireProfessional } from '@/lib/professional-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { session, professional } = await requireProfessional()

    const [accountRows, portfolio, invoices, consents, [phoneActivity]] = await Promise.all([
      db
        .select({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1),
      db
        .select({
          id: professionalPortfolioImages.id,
          pathname: professionalPortfolioImages.blobPathname,
          altText: professionalPortfolioImages.altText,
          sortOrder: professionalPortfolioImages.sortOrder,
          createdAt: professionalPortfolioImages.createdAt,
        })
        .from(professionalPortfolioImages)
        .where(eq(professionalPortfolioImages.professionalId, professional.id))
        .orderBy(asc(professionalPortfolioImages.sortOrder)),
      db
        .select({
          invoiceNumber: billingLedger.invoiceNumber,
          invoiceDate: billingLedger.invoiceDate,
          amountDue: billingLedger.amountDue,
          amountPaid: billingLedger.amountPaid,
          taxAmount: billingLedger.taxAmount,
          currency: billingLedger.currency,
          status: billingLedger.status,
          hostedInvoiceUrl: billingLedger.hostedInvoiceUrl,
          invoicePdfUrl: billingLedger.invoicePdfUrl,
          createdAt: billingLedger.createdAt,
        })
        .from(billingLedger)
        .where(eq(billingLedger.professionalId, professional.id))
        .orderBy(asc(billingLedger.invoiceDate)),
      db
        .select({
          eventType: legalConsentEvents.eventType,
          termsVersion: legalConsentEvents.termsVersion,
          termsHash: legalConsentEvents.termsHash,
          acceptedAt: legalConsentEvents.acceptedAt,
          anonymizedAt: legalConsentEvents.anonymizedAt,
        })
        .from(legalConsentEvents)
        .where(
          or(
            eq(legalConsentEvents.professionalId, professional.id),
            and(eq(legalConsentEvents.userId, session.user.id), eq(legalConsentEvents.professionalId, professional.id)),
          ),
        )
        .orderBy(asc(legalConsentEvents.acceptedAt)),
      db
        .select({ totalPhoneRequests: count() })
        .from(phoneLeadEvents)
        .where(eq(phoneLeadEvents.professionalId, professional.id)),
    ])

    const exportDocument = {
      schema: 'mesterek-professional-data-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      account: accountRows[0] ?? {
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      },
      professionalProfile: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        city: professional.city,
        county: professional.county,
        fullAddress: professional.fullAddress,
        zipCode: professional.zipCode,
        address: professional.address,
        profession: professional.profession,
        description: professional.description,
        extendedBio: professional.extendedBio,
        website: professional.website,
        site: professional.site,
        whatsappPhone: professional.whatsappPhone,
        viberPhone: professional.viberPhone,
        taxType: professional.taxType,
        taxNumber: professional.taxNumber,
        billingName: professional.billingName,
        billingAddress: professional.billingAddress,
        status: professional.status,
        isEmergency247: professional.isEmergency247,
        isAvailable: professional.isAvailable,
        membershipTier: professional.membershipTier,
        featuredBillingInterval: professional.featuredBillingInterval,
        featuredUntil: professional.featuredUntil,
        subscriptionStatus: professional.stripeSubscriptionStatus,
        trialEnd: professional.stripeTrialEnd,
        paymentStatus: professional.paymentStatus,
        importedAt: professional.importedAt,
        claimedAt: professional.claimedAt,
        verifiedAt: professional.verifiedAt,
        lastLoginAt: professional.lastLoginAt,
        createdAt: professional.createdAt,
        updatedAt: professional.updatedAt,
      },
      portfolio,
      billing: {
        amountsAreInMinorCurrencyUnits: true,
        invoices,
      },
      legalConsents: consents,
      activity: {
        recordedPhoneRequests: phoneActivity?.totalPhoneRequests ?? 0,
        profilePhoneClickCounter: professional.phoneClicks,
      },
    }

    const date = new Date().toISOString().slice(0, 10)
    return new Response(JSON.stringify(exportDocument, null, 2), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': `attachment; filename="mesterek-szemelyes-adatok-${date}.json"`,
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return Response.json(
      { error: 'A személyes adatok exportálásához bejelentkezés szükséges.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
