import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'mesterek_admin'
const OTP_COOKIE_NAME = 'mesterek_admin_otp'
const MAX_AGE = 60 * 60 * 8
const OTP_MAX_AGE = 60 * 10

function getSecret() {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return null
  return createHmac('sha256', 'mesterek-admin-session-v1').update(secret).digest()
}

function signature(expires: string, secret: Buffer) {
  return createHmac('sha256', secret).update(expires).digest('hex')
}

export async function createAdminSession() {
  const secret = getSecret()
  if (!secret) throw new Error('Az ADMIN_SECRET_KEY nincs beállítva.')
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE)
  const store = await cookies()
  const isEmbeddedPreview = Boolean(process.env.V0_DEV_APP_URL || process.env.V0_RUNTIME_URL)
  store.set(COOKIE_NAME, `${expires}.${signature(expires, secret)}`, {
    httpOnly: true,
    sameSite: isEmbeddedPreview ? 'none' : 'lax',
    secure: isEmbeddedPreview || process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function isAdmin() {
  const secret = getSecret()
  if (!secret) return false
  const value = (await cookies()).get(COOKIE_NAME)?.value
  if (!value) return false
  const [expires, supplied] = value.split('.')
  if (!expires || !supplied || !/^\d+$/.test(expires) || Number(expires) < Date.now() / 1000) return false
  const expected = signature(expires, secret)
  return supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
}

export async function createAdminOtpChallengeCookie(challengeId: string) {
  const store = await cookies()
  const isEmbeddedPreview = Boolean(process.env.V0_DEV_APP_URL || process.env.V0_RUNTIME_URL)
  store.set(OTP_COOKIE_NAME, challengeId, {
    httpOnly: true,
    sameSite: isEmbeddedPreview ? 'none' : 'strict',
    secure: isEmbeddedPreview || process.env.NODE_ENV === 'production',
    // The verifier lives at /api/admin/verify-otp, so this cookie must be sent outside /admin.
    path: '/',
    maxAge: OTP_MAX_AGE,
  })
}

export async function getAdminOtpChallengeId() {
  return (await cookies()).get(OTP_COOKIE_NAME)?.value ?? null
}

export async function clearAdminOtpChallengeCookie() {
  const store = await cookies()
  store.set(OTP_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
}

export async function clearAdminSession() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
