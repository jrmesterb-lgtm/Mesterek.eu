import 'server-only'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { professionals, user } from '@/lib/db/schema'

export async function requireProfessional() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const [identity] = await db.select({ emailVerified: user.emailVerified, twoFactorEnabled: user.twoFactorEnabled })
    .from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!identity?.emailVerified || !identity.twoFactorEnabled) throw new Error('Two-factor authentication required')

  const [professional] = await db.select().from(professionals)
    .where(and(eq(professionals.userId, session.user.id), eq(professionals.email, session.user.email)))
    .limit(1)
  if (!professional) throw new Error('Professional account not linked')
  if (professional.lockedUntil && professional.lockedUntil > new Date()) throw new Error('Account locked')

  const completedAt = new Date()
  await db.transaction(async (tx) => {
    await tx.update(professionals).set({ loginAttempts: 0, lockedUntil: null, lastLoginAt: completedAt, updatedAt: completedAt })
      .where(and(eq(professionals.id, professional.id), eq(professionals.userId, session.user.id)))
  })
  console.info('[auth]', { event: 'login_success', at: completedAt.toISOString(), userId: session.user.id, professionalId: professional.id })
  return { session, professional }
}
