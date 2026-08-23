'use server'

import { verifyPassword } from 'better-auth/crypto'
import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, professionals, user } from '@/lib/db/schema'

export type ProfessionalLoginState = {
  error?: string
  requiresTwoFactor?: boolean
}

const INVALID_CREDENTIALS = 'A belépés nem sikerült. Ellenőrizze az e-mail-címet és a jelszót.'

export async function loginProfessional(
  _previousState: ProfessionalLoginState,
  formData: FormData,
): Promise<ProfessionalLoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Adja meg az e-mail-címét és a jelszavát.' }

  try {
    const [professional] = await db
      .select({
        id: professionals.id,
        status: professionals.status,
        lockedUntil: professionals.lockedUntil,
        linkedUserId: professionals.userId,
      })
      .from(professionals)
      .where(sql`lower(${professionals.email}) = ${email}`)
      .limit(1)

    if (!professional) return { error: INVALID_CREDENTIALS }
    if (professional.lockedUntil && professional.lockedUntil > new Date()) {
      return { error: 'A fiók ideiglenesen zárolva van. Próbálja újra később.' }
    }
    if (professional.status === 'PENDING_REVIEW') {
      return { error: 'A szakemberfiók még ellenőrzés alatt áll.' }
    }
    if (professional.status === 'REJECTED') {
      return { error: 'A szakemberfiók jelenleg nem aktiválható. Kérjük, vegye fel velünk a kapcsolatot.' }
    }
    if (professional.status !== 'APPROVED') return { error: INVALID_CREDENTIALS }

    const credential = await db.transaction(async (tx) => {
      const [linkedIdentity] = professional.linkedUserId
        ? await tx
            .select({ id: user.id, email: user.email })
            .from(user)
            .where(eq(user.id, professional.linkedUserId))
            .limit(1)
        : []

      const [emailIdentity] = linkedIdentity
        ? [linkedIdentity]
        : await tx
            .select({ id: user.id, email: user.email })
            .from(user)
            .where(sql`lower(${user.email}) = ${email}`)
            .limit(1)

      if (!emailIdentity) return null

      if (professional.linkedUserId !== emailIdentity.id) {
        await tx
          .update(professionals)
          .set({ userId: emailIdentity.id, updatedAt: new Date() })
          .where(eq(professionals.id, professional.id))
      }

      const [credentialAccount] = await tx
        .select({ id: account.id, passwordHash: account.password })
        .from(account)
        .where(and(
          eq(account.userId, emailIdentity.id),
          eq(account.providerId, 'credential'),
        ))
        .limit(1)

      return credentialAccount?.passwordHash
        ? {
            accountId: credentialAccount.id,
            authUserId: emailIdentity.id,
            canonicalEmail: emailIdentity.email,
            passwordHash: credentialAccount.passwordHash,
          }
        : null
    })

    if (!credential) return { error: INVALID_CREDENTIALS }

    const passwordMatches = await verifyPassword({
      hash: credential.passwordHash,
      password,
    })
    if (!passwordMatches) return { error: INVALID_CREDENTIALS }

    // Better Auth 1.7 identifies local credentials by this complete tuple.
    // Repair legacy rows only after the submitted password has been verified.
    await db
      .update(account)
      .set({
        accountId: credential.authUserId,
        issuer: 'local:credential',
        updatedAt: new Date(),
      })
      .where(and(
        eq(account.id, credential.accountId),
        eq(account.userId, credential.authUserId),
        eq(account.providerId, 'credential'),
      ))

    const signInResult = await auth.api.signInEmail({
      body: {
        email: credential.canonicalEmail,
        password,
        callbackURL: '/dashboard',
      },
      headers: await headers(),
    })

    if ('twoFactorRedirect' in signInResult && signInResult.twoFactorRedirect) {
      const requestHeaders = await headers()
      await auth.api.sendTwoFactorOTP({ body: { trustDevice: false }, headers: requestHeaders })
      return { requiresTwoFactor: true }
    }
  } catch (error) {
    console.error('[auth] Professional login failed', {
      error: error instanceof Error ? error.message : 'Unknown authentication error',
    })
    return { error: INVALID_CREDENTIALS }
  }

  redirect('/dashboard')
}
