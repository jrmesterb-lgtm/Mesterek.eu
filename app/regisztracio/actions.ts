'use server'

import { createHash, randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { z } from 'zod'
import { getAppOrigin } from '@/lib/app-origin'
import { db } from '@/lib/db'
import { legalConsentEvents, professionals } from '@/lib/db/schema'
import { LEGAL_TERMS_HASH, LEGAL_TERMS_VERSION, legalRequestMetadata } from '@/lib/legal-audit'
import { CATEGORIES } from '@/lib/constants'
import { HUNGARIAN_COUNTIES, isHungarianLocation } from '@/lib/hungary-locations'
import { eq } from 'drizzle-orm'
import { limitPublic, PUBLIC_RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i
const PHONE_REGEX = /^(?:\+36|06)\d{8,9}$/

const schema = z.object({
  name: z.string().trim().min(3, 'Kérjük, adja meg a teljes nevét.').max(120, 'A név legfeljebb 120 karakter lehet.'),
  email: z.string().trim().toLowerCase().max(254, 'Az e-mail-cím legfeljebb 254 karakter lehet.').regex(EMAIL_REGEX, 'Kérjük, valós formátumú e-mail címet adjon meg!'),
  phone: z.string().trim().regex(PHONE_REGEX, 'Érvényes telefonszámot adjon meg (pl. +36301234567)!'),
  county: z.preprocess((value) => value ?? '', z.string().trim().refine((value) => HUNGARIAN_COUNTIES.includes(value), 'Válasszon megyét.')),
  city: z.preprocess((value) => value ?? '', z.string().trim().min(1, 'Válasszon települést.')),
  zipCode: z.preprocess((value) => value ?? '', z.string().trim().regex(/^\d{4}$/, 'Érvényes irányítószám szükséges.')),
  profession: z.preprocess((value) => value ?? '', z.string().trim().refine((value) => CATEGORIES.some((category) => category.name === value), 'Válasszon szakmát.')),
  isEmergency247: z.preprocess((value) => value === 'on', z.boolean()),
  description: z.string().trim().min(20, 'A rövid bemutatkozás legalább 20 karakter legyen.').max(600, 'A rövid bemutatkozás legfeljebb 600 karakter lehet.'),
  taxType: z.enum(['egyéni vállalkozó', 'adószámos magánszemély', 'gazdasági társaság'], { message: 'Válasszon adózási formát.' }),
  taxNumber: z.string().trim().toUpperCase().regex(/^HU\d{8}$/, 'Érvényes magyar közösségi adószám szükséges. Formátum: HU12345678'),
  billingName: z.string().trim().min(3, 'Adja meg a számlázási nevet.').max(160),
  billingAddress: z.string().trim().min(8, 'Adja meg a teljes számlázási címet.').max(240),
  billingInterval: z.enum(['month', 'year'], { message: 'Válasszon havi vagy éves előfizetést.' }),
  accepted: z.literal('on', { message: 'Az ÁSZF-et és az Adatkezelési Tájékoztatót el kell fogadni.' }),
}).refine(
  (data) => isHungarianLocation(data.county, data.city, data.zipCode),
  { message: 'A megye, a település és az irányítószám nem egyezik.', path: ['city'] },
)

export type RegistrationValues = Partial<Record<string, string>>

export type RegistrationState = {
  error?: string
  fieldErrors?: Partial<Record<string, string>>
  values?: RegistrationValues
}

// Fields whose submitted values we echo back to the client on a failed submit so
// the form (controlled in RegistrationForm) can repopulate them and the user
// never loses typed data on a validation error. Excludes secrets/one-time
// tokens (Turnstile, honeypot) which must not be replayed.
const ECHOED_FIELDS = [
  'name', 'email', 'phone', 'county', 'city', 'zipCode', 'profession',
  'description', 'taxType', 'taxNumber', 'billingName', 'billingAddress',
  'billingInterval', 'isEmergency247', 'accepted',
] as const

function echoedValues(formData: FormData): RegistrationValues {
  const values: RegistrationValues = {}
  for (const field of ECHOED_FIELDS) {
    const value = formData.get(field)
    if (typeof value === 'string') values[field] = value
  }
  return values
}

export async function startRegistration(_: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const rateLimit = await limitPublic('registration')
  if (!rateLimit.success) return { error: PUBLIC_RATE_LIMIT_MESSAGE, values: echoedValues(formData) }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return {
      error: 'Ellenőrizze a pirossal jelölt mezőket.',
      fieldErrors,
      values: echoedValues(formData),
    }
  }
  const data = parsed.data
  const dashboardToken = randomBytes(32).toString('base64url')
  const dashboardTokenHash = createHash('sha256').update(dashboardToken).digest('hex')

  try {
    if (!process.env.STRIPE_SECRET_KEY) return { error: 'A próbaidőszak most nem indítható.', values: echoedValues(formData) }
    const legalMetadata = await legalRequestMetadata()
    const professionalId = await db.transaction(async (tx) => {
      const existing = await tx.select({ id: professionals.id }).from(professionals).where(eq(professionals.email, data.email)).limit(1)
      if (existing[0]) throw new Error('DUPLICATE_REGISTRATION')
      const { accepted: _accepted, billingInterval: _billingInterval, ...profileData } = data
      const values: typeof professionals.$inferInsert = {
        ...profileData,
        status: 'PENDING_REVIEW',
        isAvailable: true,
        claimedAt: new Date(),
        // Mark as awaiting checkout. The Stripe webhook promotes this to
        // 'trial_active' once payment completes; until then the record is
        // hidden from the admin pending-review list so abandoned checkouts
        // never clutter the panel.
        paymentStatus: 'pending',
        membershipTier: 'FREE',
        featuredBillingInterval: data.billingInterval,
        dashboardToken: dashboardTokenHash,
        updatedAt: new Date(),
      }
      const [created] = await tx.insert(professionals).values(values).returning({ id: professionals.id })
      const professionalId = created.id
      await tx.insert(legalConsentEvents).values({
        professionalId,
        eventType: 'REGISTRATION_ACCEPTED',
        termsVersion: LEGAL_TERMS_VERSION,
        termsHash: LEGAL_TERMS_HASH,
        ipAddress: legalMetadata.ipAddress,
        userAgent: legalMetadata.userAgent,
      })
      return professionalId
    })
    const origin = getAppOrigin()
    const annual = data.billingInterval === 'year'
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      locale: 'hu',
      mode: 'subscription',
      integration_identifier: `registration_${randomBytes(4).toString('hex')}`,
      customer_email: data.email,
      client_reference_id: String(professionalId),
      success_url: `${origin}/szakember/${dashboardToken}?uj=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/regisztracio?megszakitva=1`,
      metadata: { professionalId: String(professionalId), product: 'FEATURED', interval: data.billingInterval },
      subscription_data: {
        trial_period_days: 60,
        metadata: { professionalId: String(professionalId), product: 'FEATURED', interval: data.billingInterval },
      },
      line_items: [{ quantity: 1, price_data: { currency: 'huf', unit_amount: annual ? 4999000 : 499000, recurring: { interval: data.billingInterval }, product_data: { name: 'Kiemelt Mester', description: annual ? 'Éves előfizetés 60 napos próbaidőszakkal' : 'Havi előfizetés 60 napos próbaidőszakkal' } } }],
    }, { idempotencyKey: `registration-${professionalId}-${dashboardTokenHash.slice(0, 24)}` })
    if (!session.url) return { error: 'A fizetési oldal most nem érhető el.', values: echoedValues(formData) }
    redirect(session.url)
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if (error instanceof Error && error.message === 'DUPLICATE_REGISTRATION') {
      return { error: 'Ezzel az e-mail-címmel már létezik adatlap. Jelentkezzen be, vagy kérjen jelszó-visszaállítást.', values: echoedValues(formData) }
    }
    return { error: 'A regisztráció most nem indítható. Kérjük, próbálja újra később.', values: echoedValues(formData) }
  }
}
