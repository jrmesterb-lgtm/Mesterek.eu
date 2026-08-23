import { createHash, timingSafeEqual } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { clearAdminOtpChallengeCookie, createAdminSession, getAdminOtpChallengeId } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { adminOtpChallenges } from '@/lib/db/schema'
import { clientIp, limitOtp, RATE_LIMIT_MESSAGE, rateLimitHeaders } from '@/lib/rate-limit'

const ADMIN_PASSWORD_HASH = 'aab81ec299272790530bb460b10cfb859d3a64e58b69461d08be2a2566424807'
const OTP_MAX_ATTEMPTS = 5

function hashOtp(challengeId: string, code: string) {
  return createHash('sha256').update(`${challengeId}:${code}:${ADMIN_PASSWORD_HASH}`).digest('hex')
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  try {
    const limit = await limitOtp(ip)
    if (!limit.success) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: rateLimitHeaders(limit) })
  } catch (error) {
    console.error('[security] OTP rate-limit check failed closed.', { error: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const body = await request.json().catch(() => null) as { code?: unknown } | null
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const challengeId = await getAdminOtpChallengeId()
  if (!challengeId) {
    console.warn('[admin:verify-otp] Missing OTP challenge cookie.', { ip })
    return NextResponse.json({ error: 'Érvénytelen vagy lejárt kód', status: 'credentials' }, { status: 400 })
  }
  if (!/^\d{6}$/.test(code)) {
    console.warn('[admin:verify-otp] Invalid OTP input format.', { challengeId, inputLength: code.length })
    return NextResponse.json({ error: 'A kódnak pontosan 6 számjegyből kell állnia.' }, { status: 400 })
  }

  const [challenge] = await db.select().from(adminOtpChallenges).where(and(eq(adminOtpChallenges.id, challengeId), isNull(adminOtpChallenges.consumedAt))).limit(1)
  if (!challenge) {
    console.warn('[admin:verify-otp] OTP challenge is missing or already consumed.', { challengeId })
    await clearAdminOtpChallengeCookie()
    return NextResponse.json({ error: 'Érvénytelen vagy lejárt kód', status: 'credentials' }, { status: 401 })
  }

  const now = Date.now()
  const expiresAt = challenge.expiresAt.getTime()
  if (expiresAt <= now || challenge.attempts >= OTP_MAX_ATTEMPTS) {
    console.warn('[admin:verify-otp] OTP challenge cannot be used.', {
      challengeId,
      reason: expiresAt <= now ? 'expired' : 'attempt_limit',
      expiresAt: challenge.expiresAt.toISOString(),
      attempts: challenge.attempts,
    })
    await clearAdminOtpChallengeCookie()
    return NextResponse.json({ error: 'Érvénytelen vagy lejárt kód', status: 'credentials' }, { status: 401 })
  }

  const supplied = Buffer.from(hashOtp(challengeId, code), 'hex')
  const expected = Buffer.from(challenge.codeHash, 'hex')
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    console.warn('[admin:verify-otp] OTP hash mismatch.', { challengeId, attempts: challenge.attempts + 1 })
    await db.update(adminOtpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(adminOtpChallenges.id, challengeId))
    return NextResponse.json({ error: 'Érvénytelen vagy lejárt kód' }, { status: 401 })
  }

  const consumed = await db.update(adminOtpChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(adminOtpChallenges.id, challengeId), isNull(adminOtpChallenges.consumedAt)))
    .returning({ id: adminOtpChallenges.id })
  if (consumed.length !== 1) {
    console.warn('[admin:verify-otp] OTP challenge was consumed concurrently.', { challengeId })
    await clearAdminOtpChallengeCookie()
    return NextResponse.json({ error: 'Érvénytelen vagy lejárt kód', status: 'credentials' }, { status: 401 })
  }

  await createAdminSession()
  await clearAdminOtpChallengeCookie()
  console.info('[admin:verify-otp] Admin session created.', { challengeId })
  return NextResponse.json({ status: 'authenticated' })
}
