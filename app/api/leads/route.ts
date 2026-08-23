import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { phoneLeadEvents, professionals } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp, limitPublic, PUBLIC_RATE_LIMIT_MESSAGE, rateLimitHeaders } from '@/lib/rate-limit'

const leadSchema = z.object({
  contractorId: z.number().int().positive(),
  interactionType: z.literal('phone_click'),
  visitorId: z.string().uuid(),
})

export async function POST(request: Request) {
  const rateLimit = await limitPublic('lead', clientIp(request.headers))
  if (!rateLimit.success) return NextResponse.json({ error: PUBLIC_RATE_LIMIT_MESSAGE }, { status: 429, headers: rateLimitHeaders(rateLimit) })

  try {
    const payload = leadSchema.safeParse(await request.json())
    if (!payload.success) return NextResponse.json({ error: 'Érvénytelen érdeklődési esemény.' }, { status: 400 })

    const [contractor] = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(and(eq(professionals.id, payload.data.contractorId), eq(professionals.status, 'APPROVED')))
      .limit(1)

    if (!contractor) return NextResponse.json({ error: 'A szakember nem található.' }, { status: 404 })

    const visitorHash = createHash('sha256').update(payload.data.visitorId).digest('hex')
    await db.transaction(async (tx) => {
      await tx.insert(phoneLeadEvents).values({
        professionalId: contractor.id,
        action: payload.data.interactionType,
        visitorHash,
      })
      await tx.update(professionals).set({ phoneClicks: sql`${professionals.phoneClicks} + 1` }).where(eq(professionals.id, contractor.id))
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Az érdeklődés nem rögzíthető.' }, { status: 500 })
  }
}
