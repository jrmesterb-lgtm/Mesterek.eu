'use server'

import { createHash } from 'node:crypto'
import { and, eq, ilike, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clearAdminSession, isAdmin } from '@/lib/admin-session'
import { CATEGORIES, hasCategoryBusinessConflict, MUNICIPALITIES, resolveImportCategory } from '@/lib/constants'
import { db } from '@/lib/db'
import { professionalReviews, professionals } from '@/lib/db/schema'
import { hasBlacklistedContractorKeyword } from '@/lib/contractor-quality'
import { extractHungarianCity, locationByCity, locationByCountyAndCity } from '@/lib/hungary-locations'

export type ImportResult = {
  inserted: number
  duplicates: number
  rejected: number
  warnings: number
  errors: string[]
  warningMessages: string[]
}

export async function logoutAdmin() {
  await clearAdminSession()
  redirect('/admin')
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Nincs jogosultság.')
}

export type ProfessionalStatusResult = { success: true; id: number; status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' } | { success: false; error: string }

export async function setProfessionalStatus(formData: FormData): Promise<ProfessionalStatusResult> {
  try {
    await requireAdmin()
    const parsed = z.object({ id: z.coerce.number().int().positive(), status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']) }).parse(Object.fromEntries(formData))
    const [record] = await db.select({ id: professionals.id }).from(professionals).where(eq(professionals.id, parsed.id)).limit(1)
    if (!record) return { success: false, error: 'A szakember nem található.' }

    const updated = await db.update(professionals)
      .set({ status: parsed.status, updatedAt: new Date() })
      .where(eq(professionals.id, parsed.id))
      .returning({ id: professionals.id, status: professionals.status })

    if (updated.length !== 1 || updated[0].status !== parsed.status) {
      console.error('[admin:setProfessionalStatus] The persisted status did not match the requested value.', { id: parsed.id, requestedStatus: parsed.status, updated })
      return { success: false, error: 'A státusz frissítése nem sikerült. Kérjük, próbálja újra.' }
    }

    revalidateProfessionalPages()
    revalidatePath('/admin/kategoria-ellenorzes')
    return { success: true, id: updated[0].id, status: updated[0].status }
  } catch (error) {
    console.error('[admin:setProfessionalStatus] Failed to update contractor status.', { error })
    return { success: false, error: error instanceof z.ZodError ? 'Érvénytelen szakemberazonosító vagy státusz.' : 'A státusz frissítése közben hiba történt.' }
  }
}

export type PendingProfessionalUpdateResult = {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<'name' | 'profession' | 'county' | 'city' | 'phone' | 'email', string>>
}

const pendingProfessionalSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(3, 'A név legalább 3 karakter legyen.').max(250, 'A név legfeljebb 250 karakter lehet.'),
  profession: z.string().trim().refine((value) => CATEGORIES.some((category) => category.name === value), 'Válasszon érvényes szakmát.'),
  county: z.string().trim().min(1, 'Válasszon megyét.'),
  city: z.string().trim().min(1, 'Válasszon települést.'),
  phone: z.string().trim().regex(/^(?:\+36|06)\d{8,9}$/, 'Érvényes telefonszámot adjon meg (pl. +36301234567)!'),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Kérjük, valós formátumú e-mail címet adjon meg!').max(254)]),
})

export async function updatePendingProfessional(formData: FormData): Promise<PendingProfessionalUpdateResult> {
  try {
    await requireAdmin()
    const parsed = pendingProfessionalSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      return {
        success: false,
        error: 'Kérjük, javítsa a megjelölt mezőket.',
        fieldErrors: Object.fromEntries(Object.entries(flattened).map(([key, messages]) => [key, messages?.[0]])),
      }
    }

    const location = locationByCountyAndCity(parsed.data.county, parsed.data.city)
    if (!location) {
      return { success: false, error: 'A megye és a település nem tartozik össze.', fieldErrors: { city: 'Válasszon a megadott megyéhez tartozó települést.' } }
    }

    const updated = await db.update(professionals).set({
      name: parsed.data.name,
      profession: parsed.data.profession,
      county: location.county,
      city: location.city,
      zipCode: location.zipCode,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      updatedAt: new Date(),
    }).where(and(eq(professionals.id, parsed.data.id), eq(professionals.status, 'PENDING_REVIEW'))).returning({ id: professionals.id })

    if (updated.length !== 1) return { success: false, error: 'A függőben lévő regisztráció nem található vagy már feldolgozták.' }
    revalidateProfessionalPages()
    return { success: true }
  } catch (error) {
    console.error('[admin:updatePendingProfessional] Failed to update pending registration.', { error })
    return { success: false, error: 'A regisztráció mentése közben hiba történt. Ellenőrizze, hogy az e-mail-cím nem foglalt-e.' }
  }
}

export async function toggleProfessionalFeature(formData: FormData) {
  await requireAdmin()
  const parsed = z.object({ id: z.coerce.number().int().positive(), feature: z.enum(['featured', 'sos']), enabled: z.enum(['true', 'false']) }).parse(Object.fromEntries(formData))
  const enabled = parsed.enabled === 'true'
  await db.update(professionals).set(parsed.feature === 'featured'
    ? { membershipTier: enabled ? 'FEATURED' : 'FREE', updatedAt: new Date() }
    : { isEmergency247: enabled, updatedAt: new Date() })
    .where(and(eq(professionals.id, parsed.id), eq(professionals.status, 'APPROVED')))
  revalidateProfessionalPages()
}

export async function updateProfessional(formData: FormData) {
  await requireAdmin()
  const parsed = z.object({ id: z.coerce.number().int().positive(), name: z.string().min(3), phone: z.string().min(8), city: z.string().min(2), profession: z.string().min(2), description: z.string().min(10), isEmergency247: z.string().optional() }).parse(Object.fromEntries(formData))
  const location = locationByCity(parsed.city)
  await db.update(professionals).set({ name: parsed.name, phone: parsed.phone, city: location?.city ?? parsed.city, county: location?.county, profession: parsed.profession, description: parsed.description, isEmergency247: parsed.isEmergency247 === 'on', status: hasBlacklistedContractorKeyword(parsed.name, parsed.profession) ? 'PENDING_REVIEW' : undefined, updatedAt: new Date() }).where(eq(professionals.id, parsed.id))
  revalidatePath('/admin')
  revalidatePath('/kereses')
}

export async function deleteReview(formData: FormData) {
  await requireAdmin()
  const parsed = z.object({ id: z.coerce.number().int().positive(), professionalId: z.coerce.number().int().positive() }).parse(Object.fromEntries(formData))
  await db.delete(professionalReviews).where(eq(professionalReviews.id, parsed.id))
  revalidatePath('/admin')
  revalidatePath(`/szakemberek/${parsed.professionalId}`)
  revalidatePath('/kereses')
}

export async function deleteProfessional(formData: FormData) {
  await requireAdmin()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  await db.delete(professionals).where(eq(professionals.id, id))
  revalidateProfessionalPages()
}

export async function moveProfessionalToReview(formData: FormData) {
  await requireAdmin()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  await db.update(professionals).set({ status: 'PENDING_REVIEW', updatedAt: new Date() }).where(eq(professionals.id, id))
  revalidateProfessionalPages()
  revalidatePath('/admin/kategoria-ellenorzes')
}

export async function reassignProfessionalCategory(formData: FormData) {
  await requireAdmin()
  const allowedCategories = CATEGORIES.map((category) => category.name)
  const parsed = z.object({
    id: z.coerce.number().int().positive(),
    profession: z.string().refine((value) => allowedCategories.includes(value as (typeof allowedCategories)[number]), 'Érvénytelen kategória.'),
  }).parse(Object.fromEntries(formData))
  await db.update(professionals).set({ profession: parsed.profession, status: 'PENDING_REVIEW', updatedAt: new Date() }).where(eq(professionals.id, parsed.id))
  revalidateProfessionalPages()
  revalidatePath('/admin/kategoria-ellenorzes')
}

export async function deleteSelectedProfessionals(ids: number[]) {
  await requireAdmin()
  const parsedIds = z.array(z.number().int().positive()).min(1).max(1000).parse(ids)
  const deleted = await db.delete(professionals).where(inArray(professionals.id, parsedIds)).returning({ id: professionals.id })
  revalidateProfessionalPages()
  return { deleted: deleted.length }
}

export async function clearImportPlaceholderEmails() {
  await requireAdmin()
  const cleared = await db.update(professionals).set({
    email: null,
    updatedAt: new Date(),
  }).where(
    ilike(professionals.email, '%@import.%'),
  ).returning({ id: professionals.id })
  revalidateProfessionalPages()
  return { cleared: cleared.length }
}

function revalidateProfessionalPages() {
  revalidatePath('/admin')
  revalidatePath('/kereses')
  revalidatePath('/')
}

const optionalCsvField = z.string().max(2000).optional().default('')
const outscraperRowSchema = z.object({
  query: optionalCsvField,
  name: optionalCsvField,
  phone: optionalCsvField,
  email: optionalCsvField,
  site: optionalCsvField,
  full_address: optionalCsvField,
  city: optionalCsvField,
  is_emergency_247: optionalCsvField,
})
const batchSchema = z.array(outscraperRowSchema).min(1).max(100)
const cityLookup = new Map(MUNICIPALITIES.map((item) => [normalize(item.name), item]))

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('hu-HU')
}

function normalizePhone(raw: string) {
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('06')) return `+36${cleaned.slice(2)}`
  if (cleaned.startsWith('36') && !cleaned.startsWith('+')) return `+${cleaned}`
  return cleaned
}

function parseEmergency247(value: string) {
  return ['1', 'true', 'yes', 'y', 'igen', 'i', '24/7', '0-24', '0–24', 'nonstop'].includes(normalize(value))
}

function mapRow(row: z.infer<typeof outscraperRowSchema>) {
  const name = row.name.trim()
  const category = row.query.trim()
  const rawCity = row.city.trim()
  const address = row.full_address.trim()
  const recognizedLocation = extractHungarianCity(rawCity, address)
  const municipality = recognizedLocation ? cityLookup.get(normalize(recognizedLocation.city)) : undefined
  const city = municipality?.name ?? recognizedLocation?.city ?? 'Ismeretlen település'
  const locationWarning = city === 'Ismeretlen település'
  if (!name) throw new Error('Hiányzik a cégnév (name mező).')
  if (!category) throw new Error('Hiányzik a kategória (query mező).')
  const profession = resolveImportCategory(category)
  if (!profession) throw new Error(`Ismeretlen vagy nem egyértelmű kategória: „${category}”. Csak pontos, jóváhagyott kategórianév használható.`)
  if (hasCategoryBusinessConflict(profession, name)) throw new Error(`A vállalkozás neve alapján nem illik a(z) „${profession}” kategóriába; kézi ellenőrzés szükséges.`)
  const phone = normalizePhone(row.phone.trim())
  if (phone.length < 8) throw new Error('Hiányzik vagy hibás a telefonszám (phone mező).')
  const website = row.site.trim()
  const suppliedEmail = row.email.trim().toLowerCase()
  const sourceKey = `outscraper:${createHash('sha256').update(`${normalize(name)}|${normalize(city)}|${phone}|${normalize(address)}`).digest('hex')}`
  return {
    name: name.slice(0, 250),
    email: suppliedEmail || null,
    phone: phone.slice(0, 80),
    city,
    county: recognizedLocation?.county,
    query: category.slice(0, 2000),
    site: website || null,
    fullAddress: address || rawCity || null,
    profession,
    description: `${name} – ${category}. Outscraper adatimportból származó helyi szakember.${locationWarning ? ` FIGYELMEZTETÉS: Ismeretlen település; kézi javítás szükséges. Eredeti helyadat: ${rawCity || address || 'nincs megadva'}.` : ''}`,
    taxType: 'importált',
    taxNumber: `IMPORT-${sourceKey.slice(11, 27)}`,
    billingName: name.slice(0, 250),
    billingAddress: address || rawCity || city,
    zipCode: municipality?.zipCode ?? '',
    address: address || rawCity || null,
    website: website || null,
    sourceKey,
    status: 'PENDING_REVIEW',
    isAvailable: true,
    isEmergency247: parseEmergency247(row.is_emergency_247),
    importedAt: new Date(),
    locationWarning,
    rawLocation: rawCity || address || 'nincs megadva',
  } as const
}

export async function importOutscraperBatch(input: unknown): Promise<ImportResult> {
  await requireAdmin()
  const rows = batchSchema.parse(input)
  const result: ImportResult = { inserted: 0, duplicates: 0, rejected: 0, warnings: 0, errors: [], warningMessages: [] }
  const seen = new Set<string>()

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const mapped = mapRow(rows[index])
      const { locationWarning, rawLocation, ...values } = mapped
      if (seen.has(values.sourceKey)) {
        result.duplicates += 1
        continue
      }
      seen.add(values.sourceKey)
      const inserted = await db.insert(professionals).values(values).onConflictDoNothing().returning({ id: professionals.id })
      if (inserted.length) {
        result.inserted += 1
        if (locationWarning) {
          result.warnings += 1
          if (result.warningMessages.length < 10) result.warningMessages.push(`${index + 1}. sor: Ismeretlen település – kézi javítás szükséges. Eredeti helyadat: ${rawLocation}`)
        }
      } else result.duplicates += 1
    } catch (error) {
      result.rejected += 1
      if (result.errors.length < 10) result.errors.push(`${index + 1}. sor: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`)
    }
  }

  revalidatePath('/admin')
  revalidatePath('/kereses')
  return result
}
