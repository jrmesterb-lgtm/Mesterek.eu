import { and, isNull, like, lt } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { professionals } from '@/lib/db/schema'

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  const hasSecret = Boolean(process.env.CRON_SECRET)
  const authorized = hasSecret
    ? authorization === `Bearer ${process.env.CRON_SECRET}`
    : request.headers.get('x-vercel-cron') === '1'

  if (!authorized) return NextResponse.json({ error: 'Nincs jogosultság.' }, { status: 401 })

  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const cleared = await db
    .update(professionals)
    .set({ email: null, updatedAt: new Date() })
    .where(and(
      like(professionals.sourceKey, 'outscraper:%'),
      like(professionals.email, '%@import.%'),
      lt(professionals.importedAt, cutoff),
      isNull(professionals.claimedAt),
      isNull(professionals.verifiedAt),
      isNull(professionals.lastLoginAt),
    ))
    .returning({ id: professionals.id })

  return NextResponse.json({ cleared: cleared.length, cutoff: cutoff.toISOString() })
}
