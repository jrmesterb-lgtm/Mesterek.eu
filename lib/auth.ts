import 'server-only'
import { betterAuth } from 'better-auth'
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
  ? ['http://localhost:3000', process.env.V0_RUNTIME_URL, 'https://*.vusercontent.net', 'https://*.vercel.run', 'https://*.v0.build'].filter(Boolean) as string[]
  : [origin(process.env.VERCEL_URL), origin(process.env.VERCEL_PROJECT_PRODUCTION_URL)].filter(Boolean) as string[]

async function sendAuthEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) throw new Error('Email service unavailable')
  await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL, to, subject, html })
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
      await sendAuthEmail(user.email, 'Jelszó visszaállítása', `<p>Jelszava visszaállításához nyissa meg az alábbi egyszer használható hivatkozást. A hivatkozás rövid időn belül lejár.</p><p><a href="${url}">Jelszó visszaállítása</a></p>`)
      console.info('[auth]', { event: 'password_reset_requested', at: new Date().toISOString(), userId: user.id })
    },
    resetPasswordTokenExpiresIn: 900,
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
      '/two-factor/verify-totp': { window: 900, max: 5 },
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
  plugins: [twoFactor({
    issuer: 'Mesterek',
    twoFactorCookieMaxAge: 300,
    trustDeviceMaxAge: 0,
    accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
  })],
})
