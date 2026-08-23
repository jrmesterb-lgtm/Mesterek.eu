import { z } from 'zod'
import { searchProfessionals } from '@/lib/professionals'

const searchSchema = z.object({
  q: z.string().trim().max(200).default(''),
  kategoria: z.string().trim().max(100).default(''),
  megye: z.string().trim().max(100).default(''),
  telepules: z.string().trim().max(100).default(''),
  iranyitoszam: z.string().trim().max(20).default(''),
  sos: z.enum(['0', '1']).default('0'),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return Response.json({ error: 'Érvénytelen keresési paraméterek.' }, { status: 400 })

  const { q, kategoria, megye, telepules, iranyitoszam, sos, offset } = parsed.data
  const results = await searchProfessionals({ query: q, category: kategoria, county: megye, city: telepules, zipCode: iranyitoszam, emergency247: sos === '1' }, offset)
  return Response.json(results, { headers: { 'Cache-Control': 'private, max-age=15' } })
}
