import { HUNGARY_LOCATION_DATA } from '@/lib/hungary-location-data'

export type HungarianLocation = { county: string; city: string; zipCode: string }
export const HUNGARIAN_LOCATIONS: readonly HungarianLocation[] = HUNGARY_LOCATION_DATA
export const HUNGARIAN_COUNTIES = [...new Set(HUNGARIAN_LOCATIONS.map(({ county }) => county))].sort((a, b) => a.localeCompare(b, 'hu'))

export function slugifyHungarian(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
export function locationsForCounty(county: string) { return HUNGARIAN_LOCATIONS.filter((item) => item.county === county) }
export const citiesForCounty = locationsForCounty
export function locationByCountyAndCity(county: string, city: string) { return HUNGARIAN_LOCATIONS.find((item) => item.county === county && item.city === city) }
export function locationByCity(city: string) { const normalized = slugifyHungarian(city); return HUNGARIAN_LOCATIONS.find((item) => slugifyHungarian(item.city) === normalized) }
export function isHungarianLocation(county: string, city: string, zipCode: string) { return HUNGARIAN_LOCATIONS.some((item) => item.county === county && item.city === city && item.zipCode === zipCode) }

export function extractHungarianCity(...rawValues: Array<string | null | undefined>) {
  const searchable = rawValues.filter((value): value is string => Boolean(value?.trim())).join(' ').replace(/\b\d{4}\b/g, ' ').replace(/\b(?:hungary|magyarorsz[aá]g)\b/gi, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU').replace(/[^a-z0-9]+/g, ' ').trim()
  if (!searchable) return null
  const padded = ` ${searchable} `
  return [...HUNGARIAN_LOCATIONS].sort((a, b) => b.city.length - a.city.length).find((item) => padded.includes(` ${slugifyHungarian(item.city).replace(/-/g, ' ')} `)) ?? null
}

export function locationBySlug(slug: string) { return HUNGARIAN_LOCATIONS.find((item) => slugifyHungarian(item.city) === slug) }
export function countyBySlug(slug: string) { return HUNGARIAN_COUNTIES.find((county) => slugifyHungarian(county) === slug) }
export function locationByCountyAndCitySlugs(countySlug: string, citySlug: string) { const county = countyBySlug(countySlug); return county ? HUNGARIAN_LOCATIONS.find((item) => item.county === county && slugifyHungarian(item.city) === citySlug) : undefined }
export function buildSeoDirectoryPath(categorySlug: string, county: string, city: string) { return `/szakmak/${categorySlug}/${slugifyHungarian(county)}/${slugifyHungarian(city)}` }
