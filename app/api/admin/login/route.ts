import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminOtpChallengeCookie } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { adminOtpChallenges } from '@/lib/db/schema'
import { checkAdminBlocked, clearAdminFailures, clientIp, RATE_LIMIT_MESSAGE, rateLimitHeaders, recordAdminFailure } from '@/lib/rate-limit'

const ADMIN_EMAIL = 'jrmesterb@gmail.com'
const ADMIN_PASSWORD_HASH = 'aab81ec299272790530bb460b10cfb859d3a64e58b69461d08be2a2566424807'
const OTP_TTL_MS = 10 * 60 * 1000

function hashOtp(challengeId: string, code: string) {
  return createHash('sha256').update(`${challengeId}:${code}:${ADMIN_PASSWORD_HASH}`).digest('hex')
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  let blocked
  try {
    blocked = await checkAdminBlocked(ip)
  } catch (error) {
    console.error('[security] Admin rate-limit check failed closed.', { error: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  if (!blocked.success) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: rateLimitHeaders(blocked) })

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const suppliedHash = createHash('sha256').update(typeof body?.password === 'string' ? body.password : '').digest()
  const expectedHash = Buffer.from(ADMIN_PASSWORD_HASH, 'hex')
  const valid = email === ADMIN_EMAIL && suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash)
  if (!valid) {
    const result = await recordAdminFailure(ip).catch(() => null)
    if (!result || !result.success) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: result ? rateLimitHeaders(result) : { 'Retry-After': '60' } })
    return NextResponse.json({ error: 'Hibás e-mail-cím vagy jelszó.' }, { status: 401 })
  }

  try {
    await clearAdminFailures(ip)
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) throw new Error('RESEND_API_KEY is missing')
    const challengeId = randomUUID()
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    await db.insert(adminOtpChallenges).values({ id: challengeId, codeHash: hashOtp(challengeId, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) })
    const message = { to: ADMIN_EMAIL, subject: `Mesterek.eu Admin Bejelentkezési kód: ${code}`, text: `Mesterek.eu Admin Bejelentkezési kód: ${code}\n\nA kód 10 percig érvényes.` }
    const resend = new Resend(resendKey)
    let result = await resend.emails.send({ ...message, from: process.env.RESEND_FROM_EMAIL || 'Mesterek.eu <onboarding@resend.dev>' })
    if (result.error?.name === 'validation_error') result = await resend.emails.send({ ...message, from: 'Mesterek.eu <onboarding@resend.dev>' })
    if (result.error) throw new Error(result.error.name)
    await createAdminOtpChallengeCookie(challengeId)
    return NextResponse.json({ status: 'otp_pending' })
  } catch (error) {
    console.error('[admin:login] OTP delivery failed.', { error: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json({ error: 'A belépési kód elküldése nem sikerült. Kérjük, próbálja újra.' }, { status: 503 })
  }
}
