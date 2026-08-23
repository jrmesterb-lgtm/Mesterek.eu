import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { sendAuthEmail } from '@/lib/auth'
import { getAppOrigin } from '@/lib/app-origin'
import { db } from '@/lib/db'
import { professionals, user as userTable, verification } from '@/lib/db/schema'
import { clientIp, limitProfessionalAuth } from '@/lib/rate-limit'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  let email = ''

  try {
    const body = await request.json() as { email?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!EMAIL_PATTERN.test(email)) {
      return Response.json({ error: 'Érvényes e-mail-címet adjon meg.' }, { status: 400 })
    }

    const limited = await limitProfessionalAuth('forgotPassword', `${ip}:${fingerprint(email)}`)
    if (!limited.success) {
      return Response.json(
        { error: 'Túl sok próbálkozás. Kérjük, próbálja újra később.' },
        { status: 429 },
      )
    }

    const [user] = await db
      .select({
        id: userTable.id,
        professionalId: professionals.id,
        professionalName: professionals.name,
        authEmail: userTable.email,
        professionalEmail: professionals.email,
        status: professionals.status,
        professionalUserId: professionals.userId,
      })
      .from(professionals)
      .leftJoin(userTable, eq(userTable.id, professionals.userId))
      .where(eq(professionals.email, email))
      .limit(1)

    console.log('Found user status:', user?.status)

    if (user?.status !== 'APPROVED') {
      return Response.json({
        message: 'Ha az e-mail-cím szerepel a rendszerünkben, elküldtük a helyreállítási hivatkozást.',
      })
    }

    // Self-heal approved legacy/imported professionals that predate auth.
    // Better Auth creates the credential account when the reset is completed.
    const authUserId = user.id ?? await db.transaction(async (tx) => {
      const [existingAuthUser] = await tx
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)

      let linkedUserId = existingAuthUser?.id

      if (!linkedUserId) {
        const newUserId = randomUUID()
        const [createdAuthUser] = await tx
          .insert(userTable)
          .values({
            id: newUserId,
            name: user.professionalName,
            email,
            emailVerified: true,
          })
          .onConflictDoNothing({ target: userTable.email })
          .returning({ id: userTable.id })

        if (createdAuthUser?.id) {
          linkedUserId = createdAuthUser.id
        } else {
          const [concurrentAuthUser] = await tx
            .select({ id: userTable.id })
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1)
          linkedUserId = concurrentAuthUser?.id
        }
      }

      if (!linkedUserId) {
        throw new Error('Unable to create authentication user for approved professional')
      }

      await tx
        .update(professionals)
        .set({ userId: linkedUserId, updatedAt: new Date() })
        .where(eq(professionals.id, user.professionalId))

      return linkedUserId
    })

    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.insert(verification).values({
      id: randomUUID(),
      identifier: `reset-password:${token}`,
      value: authUserId,
      expiresAt,
    })

    const appOrigin = getAppOrigin()
    const resetUrl = new URL('/uj-jelszo', appOrigin)
    resetUrl.searchParams.set('token', token)
    const html = `
      <!doctype html>
      <html lang="hu">
        <body style="margin:0;padding:0;background-color:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#122033;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#eef3f8;padding:32px 16px;">
            <tr>
              <td align="center" style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #d8e2ec;border-radius:14px;overflow:hidden;">
                  <tr>
                    <td align="center" style="background-color:#0a3070;padding:28px 32px;">
                      <img src="https://mesterek.eu/images/mesterek-mark.png" width="52" height="52" alt="Mesterek.eu" style="display:block;width:52px;height:52px;margin:0 auto 12px;border:0;" />
                      <div style="margin:0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.3px;">Mesterek.eu</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 32px 40px;">
                      <h1 style="margin:0 0 18px;color:#0a3070;font-size:26px;line-height:1.3;font-weight:800;">Új jelszó beállítása</h1>
                      <p style="margin:0 0 16px;color:#35475a;font-size:16px;line-height:1.6;">Jelszó-visszaállítási kérelmet kaptunk a Mesterek.eu-fiókjához.</p>
                      <p style="margin:0 0 28px;color:#35475a;font-size:16px;line-height:1.6;">Az alábbi biztonságos hivatkozás egyszer használható, és <strong style="color:#122033;">24 órán át érvényes</strong>.</p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0;">
                        <tr>
                          <td align="center" style="background-color:#0a3070;border-radius:8px;">
                            <a href="${resetUrl.toString()}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:16px;line-height:1.2;font-weight:700;text-decoration:none;border-radius:8px;">Új jelszó beállítása</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a3070;padding:22px 32px;border-top:4px solid #0a3070;">
                      <p style="margin:0;color:#c9d7e6;font-size:13px;line-height:1.6;">Ha nem Ön kérte a módosítást, hagyja figyelmen kívül ezt az üzenetet. Fiókja biztonságban marad.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`

    try {
      console.log('Attempting to send email via Resend...')
      const result = await sendAuthEmail(email, 'Jelszó-helyreállítás – Mesterek.eu', html)
      console.log('Resend success:', result)
    } catch (error) {
      console.error('RESEND FATAL ERROR:', error)
      throw error
    }

    return Response.json({
      message: 'Ha az e-mail-cím szerepel a rendszerünkben, elküldtük a helyreállítási hivatkozást.',
    })
  } catch (error) {
    console.error('PASSWORD RESET FATAL ERROR:', error)
    throw error
  }
}
