import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

export const RATE_LIMIT_MESSAGE = 'Túl sok sikertelen próbálkozás. Kérjük, próbálja újra később.'
export const PUBLIC_RATE_LIMIT_MESSAGE = 'Túl sok kérés érkezett. Kérjük, próbálja újra később.'

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

const adminFailures = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'ratelimit:admin-login', analytics: true }) : null
const otpAttempts = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(8, '15 m'), prefix: 'ratelimit:admin-otp' }) : null
const professionalAuthLimiters = redis ? {
  login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'ratelimit:professional-login' }),
  twoFactor: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'ratelimit:professional-2fa' }),
  forgotPassword: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '15 m'), prefix: 'ratelimit:professional-forgot-password' }),
  resetPassword: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'ratelimit:professional-reset-password' }),
} : null

const publicLimiters = redis ? {
  deletion: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'ratelimit:deletion' }),
  registration: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'ratelimit:registration' }),
  review: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'), prefix: 'ratelimit:review' }),
  lead: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'ratelimit:lead' }),
} : null

export type PublicLimiter = keyof NonNullable<typeof publicLimiters>
export type ProfessionalAuthLimiter = keyof NonNullable<typeof professionalAuthLimiters>
export type LimitResult = { success: boolean; limit: number; remaining: number; reset: number }

export function clientIp(source: Headers) {
  return source.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || source.get('x-forwarded-for')?.split(',')[0]?.trim()
    || source.get('x-real-ip')?.trim()
    || 'unknown'
}

export async function currentClientIp() {
  return clientIp(await headers())
}

export function rateLimitHeaders(result: LimitResult) {
  return {
    'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}

export async function checkAdminBlocked(ip: string): Promise<LimitResult> {
  if (!adminFailures) throw new Error('Admin rate limiting is not configured')
  const remaining = await adminFailures.getRemaining(ip)
  return { success: remaining.remaining > 0, ...remaining }
}

export async function recordAdminFailure(ip: string) {
  if (!adminFailures) throw new Error('Admin rate limiting is not configured')
  return adminFailures.limit(ip)
}

export async function clearAdminFailures(ip: string) {
  if (!adminFailures) throw new Error('Admin rate limiting is not configured')
  await adminFailures.resetUsedTokens(ip)
}

export async function limitOtp(ip: string) {
  if (!otpAttempts) throw new Error('Admin rate limiting is not configured')
  return otpAttempts.limit(ip)
}

export async function limitProfessionalAuth(kind: ProfessionalAuthLimiter, key: string): Promise<LimitResult> {
  if (!professionalAuthLimiters) throw new Error('Professional authentication rate limiting is not configured')
  try {
    return await professionalAuthLimiters[kind].limit(key)
  } catch (error) {
    console.error('[security] Professional auth rate-limit check failed closed.', { kind, error: error instanceof Error ? error.message : 'unknown' })
    throw new Error('Professional authentication rate limiting is unavailable')
  }
}

export async function limitPublic(kind: PublicLimiter, suppliedIp?: string): Promise<LimitResult> {
  const ip = suppliedIp ?? await currentClientIp()
  if (!publicLimiters) {
    console.error('[security] Public rate limiting is unavailable; rejecting request.', { kind })
    return { success: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 }
  }
  try {
    return await publicLimiters[kind].limit(ip)
  } catch (error) {
    console.error('[security] Public rate-limit check failed; rejecting request.', { kind, error: error instanceof Error ? error.message : 'unknown' })
    return { success: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 }
  }
}
