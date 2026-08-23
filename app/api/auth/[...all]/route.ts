import { createHash } from 'node:crypto'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { toNextJsHandler } from 'better-auth/next-js'
import { limitProfessionalAuth, rateLimitHeaders, type ProfessionalAuthLimiter } from '@/lib/rate-limit'

const handler = toNextJsHandler(auth)
const LOCK_MINUTES = 15

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}
function fingerprint(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 16)
}
function log(event: string, details: Record<string, unknown>) {
  console.info('[auth]', { event, at: new Date().toISOString(), ...details })
}

async function loginEmail(request: Request) {
  try { return String((await request.clone().json()).email || '').trim().toLowerCase() } catch { return '' }
}

async function recordPasswordFailure(email: string, ip: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<{ id: number; login_attempts: number }>('SELECT id, login_attempts FROM professionals WHERE lower(email) = $1 FOR UPDATE', [email])
    if (result.rows[0]) {
      const attempts = result.rows[0].login_attempts + 1
      await client.query('UPDATE professionals SET login_attempts = $1, locked_until = CASE WHEN $1 >= 5 THEN now() + ($2 * interval \'1 minute\') ELSE locked_until END, updated_at = now() WHERE id = $3', [attempts, LOCK_MINUTES, result.rows[0].id])
      if (attempts >= 5) log('account_locked', { professionalId: result.rows[0].id, ip })
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

async function isLocked(email: string) {
  const result = await pool.query<{ id: number; locked_until: Date | null }>('SELECT id, locked_until FROM professionals WHERE lower(email) = $1 LIMIT 1', [email])
  const row = result.rows[0]
  return row?.locked_until && row.locked_until > new Date() ? row : null
}

export async function POST(request: Request) {
  const path = new URL(request.url).pathname
  const ip = clientIp(request)
  const email = await loginEmail(request)
  const rule: ProfessionalAuthLimiter | undefined = path.endsWith('/sign-in/email') ? 'login'
    : path.endsWith('/two-factor/verify-otp') || path.endsWith('/two-factor/send-otp') ? 'twoFactor'
      : path.endsWith('/request-password-reset') || path.endsWith('/forget-password') ? 'forgotPassword'
        : path.endsWith('/reset-password') ? 'resetPassword' : undefined
  if (rule) {
    try {
      const limited = await limitProfessionalAuth(rule, `${ip}:${email ? fingerprint(email) : 'anonymous'}`)
      if (!limited.success) return Response.json({ message: 'Túl sok próbálkozás.' }, { status: 429, headers: rateLimitHeaders(limited) })
    } catch {
      return Response.json({ message: 'A hitelesítési szolgáltatás átmenetileg nem érhető el.' }, { status: 503 })
    }
  }
  if (path.endsWith('/sign-in/email')) {
    const emailHash = fingerprint(email)
    const locked = email ? await isLocked(email) : null
    if (locked) {
      log('login_blocked_locked', { professionalId: locked.id, emailHash, ip })
      return Response.json({ message: 'A bejelentkezés nem sikerült.' }, { status: 401 })
    }
    const response = await handler.POST(request)
    if (!response.ok) {
      if (email) await recordPasswordFailure(email, ip)
      log('login_failed', { emailHash, ip })
    } else {
      log('password_accepted_awaiting_2fa', { emailHash, ip })
    }
    return response
  }
  const response = await handler.POST(request)
  if (path.endsWith('/two-factor/verify-otp')) log(response.ok ? 'two_factor_success' : 'two_factor_failed', { ip })
  if (path.endsWith('/two-factor/send-otp')) log(response.ok ? 'two_factor_code_sent' : 'two_factor_code_send_failed', { ip })
  if (path.endsWith('/reset-password')) log(response.ok ? 'password_reset_completed' : 'password_reset_failed', { ip })
  return response
}

export const GET = handler.GET
