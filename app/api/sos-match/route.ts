import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSosProfessionalMatch } from '@/lib/professionals'

const querySchema = z.object({
  profession: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    profession: url.searchParams.get('profession'),
    city: url.searchParams.get('city'),
  })
  if (!parsed.success) return NextResponse.json({ error: 'Érvénytelen SOS keresés.' }, { status: 400 })

  const match = await getSosProfessionalMatch(parsed.data.profession, parsed.data.city)
  if (!match) return NextResponse.json({ match: null })
  return NextResponse.json({ match })
}
