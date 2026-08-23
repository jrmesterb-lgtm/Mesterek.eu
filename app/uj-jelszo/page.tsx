import Link from 'next/link'
import { and, eq, gt } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'
import { ResetPasswordForm } from '@/components/reset-password-form'
import { db } from '@/lib/db'
import { user, verification } from '@/lib/db/schema'

export const metadata = {
  title: 'Új jelszó | Mesterek',
  description: 'Új jelszó beállítása a Mesterek szakemberfiókhoz.',
  robots: { index: false, follow: false },
}

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const [activeToken] = token
    ? await db
        .select({ id: verification.id, email: user.email })
        .from(verification)
        .innerJoin(user, eq(user.id, verification.value))
        .where(and(
          eq(verification.identifier, `reset-password:${token}`),
          gt(verification.expiresAt, new Date()),
        ))
        .limit(1)
    : []
  const invalid = !token || !activeToken

  return (
    <AppShell>
      <section className="bg-secondary px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl md:p-8">
          <p className="font-bold text-primary">Szakemberfiók</p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight md:text-4xl">Új jelszó beállítása</h1>
          {invalid ? (
            <div className="mt-6 flex flex-col gap-5">
              <p role="alert" className="rounded-lg bg-secondary p-4 font-bold leading-relaxed text-secondary-foreground">A helyreállítási hivatkozás érvénytelen vagy lejárt.</p>
              <Link href="/elfelejtett-jelszo" className="btn-primary w-full">Új hivatkozás kérése</Link>
            </div>
          ) : (
            <div className="mt-7"><ResetPasswordForm token={token} email={activeToken.email} /></div>
          )}
        </div>
      </section>
    </AppShell>
  )
}
