import { createHash } from 'node:crypto'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

function hash(token: string) { return createHash('sha256').update(token).digest('hex') }

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.emailVerified || !session.user.twoFactorEnabled) return Response.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { token?: unknown } | null
  if (!body || typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{40,60}$/.test(body.token)) return Response.json({ message: 'Invalid enrollment' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<{ id: number; email: string | null; user_id: string | null }>('SELECT id, email, user_id FROM professionals WHERE dashboard_token = $1 FOR UPDATE', [hash(body.token)])
    const professional = result.rows[0]
    if (!professional || professional.user_id || professional.email?.toLowerCase() !== session.user.email.toLowerCase()) {
      await client.query('ROLLBACK')
      return Response.json({ message: 'Invalid enrollment' }, { status: 400 })
    }
    await client.query('UPDATE professionals SET user_id = $1, dashboard_token = NULL, login_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = $2', [session.user.id, professional.id])
    await client.query('COMMIT')
    console.info('[auth]', { event: 'professional_enrolled', at: new Date().toISOString(), userId: session.user.id, professionalId: professional.id })
    return Response.json({ status: 'enrolled' })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[auth]', { event: 'professional_enrollment_failed', at: new Date().toISOString(), userId: session.user.id })
    return Response.json({ message: 'Invalid enrollment' }, { status: 400 })
  } finally { client.release() }
}
