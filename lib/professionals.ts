import 'server-only'
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { professionalPortfolioImages, professionalReviews, professionals } from '@/lib/db/schema'

export type ProfessionalFilters = {
  query?: string
  category?: string
  city?: string
  county?: string
  zipCode?: string
  emergency247?: boolean
}

export async function getProfessionalLocationAvailability(emergency247 = false) {
  return db
    .selectDistinct({
      profession: professionals.profession,
      city: professionals.city,
      county: professionals.county,
      zipCode: professionals.zipCode,
    })
    .from(professionals)
    .where(emergency247 ? and(eq(professionals.status, 'APPROVED'), eq(professionals.isEmergency247, true)) : eq(professionals.status, 'APPROVED'))
    .orderBy(asc(professionals.city))
}

export async function getSosProfessionalMatch(profession: string, city: string) {
  const [match] = await db
    .select({
      id: professionals.id,
      name: professionals.name,
      profession: professionals.profession,
      city: professionals.city,
      phone: professionals.phone,
    })
    .from(professionals)
    .where(and(
      eq(professionals.status, 'APPROVED'),
      eq(professionals.isEmergency247, true),
      eq(professionals.profession, profession),
      eq(professionals.city, city),
    ))
    .orderBy(
      desc(professionals.isAvailable),
      desc(sql`${professionals.membershipTier} = 'FEATURED'`),
      asc(professionals.name),
      asc(professionals.id),
    )
    .limit(1)
  return match ?? null
}

export const PROFESSIONAL_PAGE_SIZE = 20

function professionalWhere({ query = '', category = '', city = '', county = '', zipCode = '', emergency247 = false }: ProfessionalFilters) {
  const filters = [eq(professionals.status, 'APPROVED')]
  if (emergency247) filters.push(eq(professionals.isEmergency247, true))
  if (category) filters.push(eq(professionals.profession, category))
  if (county) filters.push(eq(professionals.county, county))
  if (city) filters.push(eq(professionals.city, city))
  if (zipCode) filters.push(eq(professionals.zipCode, zipCode))
  if (query.trim()) {
    const term = `%${query.trim()}%`
    filters.push(or(
      ilike(professionals.name, term),
      ilike(professionals.profession, term),
      ilike(professionals.description, term),
    )!)
  }
  return and(...filters)!
}

export async function getPopulatedSeoCombinations() {
  return db.selectDistinct({ profession: professionals.profession, city: professionals.city }).from(professionals).where(eq(professionals.status, 'APPROVED')).orderBy(professionals.profession, professionals.city)
}

export async function searchProfessionals(filters: ProfessionalFilters = {}, offset = 0) {
  const where = professionalWhere(filters)
  const searchedZip = filters.zipCode?.trim() ?? ''
  const searchedCity = filters.city?.trim() ?? ''
  const searchedCounty = filters.county?.trim() ?? ''
  const locationRank = sql<number>`case
    when ${searchedZip} <> '' and lower(coalesce(${professionals.zipCode}, '')) = lower(${searchedZip}) then 0
    when ${searchedCity} <> '' and lower(${professionals.city}) = lower(${searchedCity}) then 1
    when ${searchedCounty} <> '' and lower(${professionals.county}) = lower(${searchedCounty}) then 2
    else 3
  end`
  const averageRating = sql<number>`coalesce((select avg(r.rating) from professional_reviews r where r.professional_id = ${professionals.id}), 0)`
  const reviewCount = sql<number>`(select count(*) from professional_reviews r where r.professional_id = ${professionals.id})`
  const [items, [{ total }]] = await Promise.all([
    db.select().from(professionals).where(where).orderBy(
      desc(professionals.isAvailable),
      desc(sql`${professionals.membershipTier} = 'FEATURED'`),
      asc(locationRank),
      desc(averageRating),
      desc(reviewCount),
      asc(professionals.name),
      asc(professionals.id),
    ).limit(PROFESSIONAL_PAGE_SIZE).offset(offset),
    db.select({ total: count() }).from(professionals).where(where),
  ])
  const itemIds = items.map((item) => item.id)
  const featuredIds = items.filter((item) => item.membershipTier === 'FEATURED').map((item) => item.id)
  const [gallery, reviewSummaries] = await Promise.all([
    featuredIds.length ? db.select().from(professionalPortfolioImages).where(inArray(professionalPortfolioImages.professionalId, featuredIds)).orderBy(professionalPortfolioImages.sortOrder) : [],
    itemIds.length ? db.select({
      professionalId: professionalReviews.professionalId,
      reviewCount: count(),
      averageRating: sql<number>`round(avg(${professionalReviews.rating})::numeric, 1)`,
    }).from(professionalReviews).where(inArray(professionalReviews.professionalId, itemIds)).groupBy(professionalReviews.professionalId) : [],
  ])
  const summaryByProfessional = new Map(reviewSummaries.map((summary) => [summary.professionalId, summary]))
  const itemsWithGallery = items.map((item) => {
    const summary = summaryByProfessional.get(item.id)
    return { ...item, gallery: gallery.filter((image) => image.professionalId === item.id), reviewCount: summary?.reviewCount ?? 0, averageRating: Number(summary?.averageRating ?? 0) }
  })
  return { items: itemsWithGallery, total, hasMore: offset + items.length < total }
}
