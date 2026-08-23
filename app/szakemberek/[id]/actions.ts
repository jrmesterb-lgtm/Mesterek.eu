'use server'

import { createHash } from 'node:crypto'
import { and, eq, gt, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { phoneLeadEvents, professionalReviews, professionals } from '@/lib/db/schema'
import { limitPublic, PUBLIC_RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

export type ReviewState = { status: 'idle' | 'success' | 'error'; message: string }

export async function submitReview(professionalId: number, _previous: ReviewState, formData: FormData): Promise<ReviewState> {
  const rateLimit = await limitPublic('review')
  if (!rateLimit.success) return { status: 'error', message: PUBLIC_RATE_LIMIT_MESSAGE }

  const rawName = String(formData.get('clientName') ?? '').trim()
  const clientName = rawName || 'Névtelen ügyfél'
  const visitorId = String(formData.get('visitorId') ?? '')
  const comment = String(formData.get('comment') ?? '').trim()
  const rating = Number(formData.get('rating'))
  if (rawName && (rawName.length < 2 || rawName.length > 80)) return { status: 'error', message: 'A név 2–80 karakter hosszú legyen, vagy hagyja üresen.' }
  if (!/^[0-9a-f-]{36}$/i.test(visitorId)) return { status: 'error', message: 'Kérjük, frissítse az oldalt, majd próbálja újra.' }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { status: 'error', message: 'Válasszon 1 és 5 csillag közötti értékelést.' }
  if (comment.length > 1500) return { status: 'error', message: 'A vélemény legfeljebb 1500 karakter hosszú lehet.' }
  const visitorHash = createHash('sha256').update(visitorId).digest('hex')
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [professional] = await db.select({ id: professionals.id }).from(professionals).where(and(eq(professionals.id, professionalId), eq(professionals.status, 'APPROVED'))).limit(1)
  if (!professional) return { status: 'error', message: 'Ez a szakember nem értékelhető.' }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${professionalId}, hashtext(${visitorHash}))`)
    const [recent] = await tx.select({ id: professionalReviews.id }).from(professionalReviews).where(and(eq(professionalReviews.professionalId, professionalId), eq(professionalReviews.visitorHash, visitorHash), gt(professionalReviews.createdAt, cutoff))).limit(1)
    if (recent) return false
    const [contact] = await tx.select({ id: phoneLeadEvents.id }).from(phoneLeadEvents).where(and(eq(phoneLeadEvents.professionalId, professionalId), eq(phoneLeadEvents.visitorHash, visitorHash), gt(phoneLeadEvents.createdAt, cutoff))).limit(1)
    await tx.insert(professionalReviews).values({ professionalId, clientName, rating, comment, visitorHash, verifiedContact: Boolean(contact) })
    return true
  })
  if (!result) return { status: 'error', message: 'Erről az eszközről már érkezett értékelés ehhez a szakemberhez az elmúlt 30 napban.' }
  revalidatePath(`/szakemberek/${professionalId}`)
  revalidatePath('/kereses')
  return { status: 'success', message: 'Köszönjük! Véleménye azonnal megjelent.' }
}
