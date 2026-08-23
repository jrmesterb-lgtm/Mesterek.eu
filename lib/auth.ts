import 'server-only'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { twoFactor } from 'better-auth/plugins'
import { Resend } from 'resend'
import { pool } from '@/lib/db'

function origin(value?: string) {
  if (!value) return undefined
  return value.startsWith('http') ? value : `https://${value}`
}

const baseURL = process.env.BETTER_AUTH_URL
  ?? origin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  ?? origin(process.env.VERCEL_URL)
  ?? process.env.V0_RUNTIME_URL
  ?? 'https://mesterek.eu'

const trustedOrigins = process.env.NODE_ENV === 'development'
  ? [
      'http://localhost:3000',
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
    ].filter(Boolean) as string[]
  : [origin(process.env.VERCEL_URL), origin(process.env.VERCEL_PROJECT_PRODUCTION_URL)].filter(Boolean) as string[]

export async function sendAuthEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = 'info@mesterek.eu'

  if (!apiKey) {
    console.error('[auth] Email configuration is incomplete', { missing: ['RESEND_API_KEY'] })
    throw new Error('Email service unavailable: missing RESEND_API_KEY')
  }

  try {
    // Resend reports provider failures in the returned `error` property; it does
    // not consistently throw. Check that result explicitly so Better Auth never
    // treats a rejected password-reset email as successfully dispatched.
    const { data, error } = await new Resend(apiKey).emails.send({ from, to, subject, html })

    if (error) {
      console.error('[auth] Resend rejected authentication email', {
        name: error.name,
        message: error.message,
        recipientDomain: to.split('@')[1] ?? 'unknown',
        subject,
      })
      throw new Error(`Resend email failed: ${error.message}`)
    }

    console.info('[auth] Authentication email dispatched', {
      emailId: data?.id,
      recipientDomain: to.split('@')[1] ?? 'unknown',
      subject,
    })

    return data
  } catch (error) {
    console.error('[auth] Authentication email dispatch failed', {
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      recipientDomain: to.split('@')[1] ?? 'unknown',
      subject,
    })
    throw error
  }
}

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const html = `
        <!doctype html>
        <html lang="hu">
          <body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
                    <tr><td style="background:#facc15;padding:24px 32px;font-size:24px;font-weight:800;color:#18181b;">Mesterek.eu</td></tr>
                    <tr>
                      <td style="padding:32px;">
                        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;">Jelszó-helyreállítás</h1>
                        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Jelszó-visszaállítási kérelmet kaptunk a Mesterek.eu-fiókjához.</p>
                        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Az alábbi biztonságos hivatkozás egyszer használható, és <strong>24 órán át érvényes</strong>.</p>
                        <p style="margin:0 0 28px;">
                          <a href="${url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 22px;border-radius:8px;">Új jelszó beállítása</a>
                        </p>
                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#52525b;">Ha a gomb nem működik, másolja ezt a hivatkozást a böngészőjébe:</p>
                        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;"><a href="${url}" style="color:#854d0e;">${url}</a></p>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">Ha nem Ön kérte a jelszó módosítását, hagyja figyelmen kívül ezt az üzenetet. Jelszava változatlan marad.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`

      await sendAuthEmail(user.email, 'Jelszó-helyreállítás – Mesterek.eu', html)
      console.info('[auth]', { event: 'password_reset_requested', at: new Date().toISOString(), userId: user.id })
    },
    resetPasswordTokenExpiresIn: 60 * 60 * 24,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail(user.email, 'E-mail-cím megerősítése', `<p>E-mail-címe megerősítéséhez nyissa meg az alábbi egyszer használható hivatkozást:</p><p><a href="${url}">E-mail-cím megerősítése</a></p>`)
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      '/sign-in/email': { window: 900, max: 5 },
      '/two-factor/send-otp': { window: 900, max: 3 },
      '/two-factor/verify-otp': { window: 900, max: 5 },
      '/request-password-reset': { window: 900, max: 3 },
      '/reset-password': { window: 900, max: 5 },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: { sameSite: 'none' as const, secure: true, httpOnly: true },
        },
      }
    : {}),
  plugins: [
    twoFactor({
      issuer: 'Mesterek',
      twoFactorCookieMaxAge: 300,
      trustDeviceMaxAge: 0,
      otpOptions: {
        period: 5,
        digits: 6,
        allowedAttempts: 5,
        storeOTP: 'hashed',
        sendOTP: async ({ user, otp }, ctx) => {
          // Distinguish 2FA setup (full session, dashboard) from login (pending
          // two-factor cookie). Login carries Better Auth's signed "two_factor"
          // cookie; dashboard setup runs on a normal session without it.
          let isSetup = false
          try {
            const pendingCookie = ctx?.context.createAuthCookie('two_factor')
            if (ctx && pendingCookie) {
              const pending = await ctx.getSignedCookie(pendingCookie.name, ctx.context.secret)
              isSetup = !pending
            }
          } catch {
            isSetup = false
          }

          const subject = isSetup ? 'Kétlépcsős azonosítás beállítása' : 'Belépési ellenőrző kód – Mesterek.eu'
          const title = isSetup ? 'Biztonsági ellenőrző kód' : 'Belépési ellenőrző kód'
          const intro = isSetup
            ? 'A kétlépcsős azonosítás (2FA) bekapcsolásához és a fiókja védelméhez kérjük, adja meg az alábbi hatjegyű kódot a felületen:'
            : 'A fiókjába történő belépés befejezéséhez adja meg az alábbi hatjegyű kódot:'
          const warning = isSetup
            ? 'Ha nem Ön kezdeményezte a kétlépcsős azonosítás beállítását, hagyja figyelmen kívül ezt az e-mailt, és módosítsa jelszavát.'
            : 'Ha nem Ön próbált belépni, ne adja meg senkinek ezt a kódot, és módosítsa jelszavát.'

          const html = `
            <!doctype html>
            <html lang="hu">
              <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
                  <tr><td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                      <tr><td style="background:#1e40af;padding:24px 32px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                          <td style="vertical-align:middle;padding-right:12px;">
                            <img src="https://mesterek.eu/images/mesterek-mark.png" alt="Mesterek.eu" height="40" style="display:block;height:40px;width:auto;max-height:40px;border:0;" />
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Mesterek.eu</span>
                          </td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:36px 32px;">
                        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">${title}</h1>
                        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">${intro}</p>
                        <div style="margin:0 0 24px;padding:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;text-align:center;">
                          <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#1e40af;">${otp}</span>
                        </div>
                        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">A kód 5 percig érvényes, és csak egyszer használható.</p>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">${warning}</p>
                      </td></tr>
                      <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                        <span style="font-size:12px;line-height:1.5;color:#94a3b8;">Ez egy automatikus üzenet a Mesterek.eu rendszeréből. Kérjük, ne válaszoljon rá.</span>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </body>
            </html>`
          await sendAuthEmail(user.email, subject, html)
        },
      },
      accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
    }),
    nextCookies(),
  ],
})
