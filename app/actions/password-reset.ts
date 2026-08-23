'use server'

import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { and, eq, gt } from 'drizzle-orm'
import { headers } from 'next/headers'
import { POST } from '@/app/api/password-reset/route'
import { db } from '@/lib/db'
import { account, session, user, verification } from '@/lib/db/schema'

export type PasswordResetActionResult = {
  success: boolean
  message?: string
  error?: string
}

export async function completePasswordReset(formData: FormData): Promise<PasswordResetActionResult> {
  const token = String(formData.get('token') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const newPassword = String(formData.get('password') ?? '')
  const confirmation = String(formData.get('confirmation') ?? '')

  if (!token || !email) {
    return { success: false, error: 'A helyreállítási hivatkozás érvénytelen vagy lejárt.' }
  }
  if (newPassword !== confirmation) {
    return { success: false, error: 'A két jelszó nem egyezik.' }
  }
  if (newPassword.length < 12 || newPassword.length > 128) {
    return { success: false, error: 'A jelszó 12–128 karakterből álljon.' }
  }

  const [activeToken] = await db
    .select({ id: verification.id, userId: user.id })
    .from(verification)
    .innerJoin(user, eq(user.id, verification.value))
    .where(and(
      eq(verification.identifier, `reset-password:${token}`),
      eq(user.email, email),
      gt(verification.expiresAt, new Date()),
    ))
    .limit(1)

  if (!activeToken) {
    return { success: false, error: 'A helyreállítási hivatkozás érvénytelen vagy lejárt.' }
  }

  try {
    const passwordHash = await hashPassword(newPassword)

    await db.transaction(async (tx) => {
      const [consumedToken] = await tx
        .delete(verification)
        .where(and(
          eq(verification.id, activeToken.id),
          eq(verification.identifier, `reset-password:${token}`),
          gt(verification.expiresAt, new Date()),
        ))
        .returning({ id: verification.id })

      if (!consumedToken) {
        throw new Error('RESET_TOKEN_ALREADY_USED_OR_EXPIRED')
      }

      const [credentialAccount] = await tx
        .select({ id: account.id })
        .from(account)
        .where(and(
          eq(account.userId, activeToken.userId),
          eq(account.providerId, 'credential'),
        ))
        .limit(1)

      if (credentialAccount) {
        await tx
          .update(account)
          .set({
            accountId: activeToken.userId,
            issuer: 'local:credential',
            password: passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(account.id, credentialAccount.id))
      } else {
        await tx.insert(account).values({
          id: randomUUID(),
          accountId: activeToken.userId,
          providerId: 'credential',
          issuer: 'local:credential',
          userId: activeToken.userId,
          password: passwordHash,
        })
      }

      await tx
        .update(user)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(and(eq(user.id, activeToken.userId), eq(user.email, email)))

      await tx.delete(session).where(eq(session.userId, activeToken.userId))
    })

    return { success: true }
  } catch (error) {
    console.error('PASSWORD RESET COMPLETION ERROR:', error)
    return { success: false, error: 'A helyreállítási hivatkozás érvénytelen vagy lejárt.' }
  }
}

export async function sendPasswordResetEmail(
  _previousState: PasswordResetActionResult,
  formData: FormData,
): Promise<PasswordResetActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin') || process.env.V0_RUNTIME_URL || 'http://localhost:3000'

  const response = await POST(new Request(new URL('/api/password-reset', origin), {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify({ email }),
  }))

  const result = await response.json() as { message?: string; error?: string }

  if (!response.ok) {
    return {
      success: false,
      error: result.error || 'A kérés most nem küldhető el. Kérjük, próbálja újra később.',
    }
  }

  return {
    success: true,
    message: result.message || 'Ha az e-mail-cím szerepel a rendszerünkben, elküldtük a helyreállítási hivatkozást.',
  }
}
