import type { MetadataRoute } from 'next'
import { CATEGORIES } from '@/lib/constants'
import { slugifyHungarian } from '@/lib/hungary-locations'
import { getPopulatedSeoCombinations } from '@/lib/professionals'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://mesterek.eu'
  const combinations = await getPopulatedSeoCombinations()
  const pages = combinations.flatMap((item) => { const category = CATEGORIES.find((entry) => entry.name === item.profession); return category ? [{ url: `${base}/${category.key}/${slugifyHungarian(item.city)}`, changeFrequency: 'weekly' as const, priority: 0.8 }] : [] })
  return [{ url: base, changeFrequency: 'daily', priority: 1 }, { url: `${base}/kereses`, changeFrequency: 'daily', priority: 0.9 }, { url: `${base}/regisztracio`, changeFrequency: 'monthly', priority: 0.6 }, ...pages]
}
