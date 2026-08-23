import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ProfessionalLoginForm } from '@/components/professional-login-form'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Belépés | Mesterek',
  description: 'Belépés a Mesterek szakemberfiókba.',
  robots: { index: false, follow: false },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const { reset } = await searchParams
  if (session?.user) redirect('/dashboard')

  return (
    <AppShell>
      <section className="bg-secondary px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl md:p-8">
          <p className="font-bold text-primary">Szakemberfiók</p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight md:text-4xl">Belépés</h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">Adja meg a regisztrációkor használt e-mail-címét és jelszavát.</p>
          {reset === 'success' && <p role="status" className="mt-5 rounded-lg bg-secondary p-4 font-bold leading-relaxed text-secondary-foreground">Az új jelszó elkészült. Most már beléphet.</p>}
          <div className="mt-7"><ProfessionalLoginForm /></div>
          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">Még nincs szakemberfiókja? <Link href="/regisztracio" className="font-bold text-primary underline underline-offset-4">Regisztráljon szakemberként</Link>.</p>
        </div>
      </section>
    </AppShell>
  )
}
