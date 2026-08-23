import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { PasswordRecoveryForm } from '@/components/password-recovery-form'

export const metadata = {
  title: 'Jelszó-helyreállítás | Mesterek',
  description: 'Jelszó-helyreállítás vagy szakemberfiók aktiválása.',
  robots: { index: false, follow: false },
}

export default function PasswordRecoveryPage() {
  return (
    <AppShell>
      <section className="bg-secondary px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl md:p-8">
          <p className="font-bold text-primary">Szakemberfiók</p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight md:text-4xl">Jelszó-helyreállítás</h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">Adja meg a regisztrációkor használt e-mail-címét. E-mailben küldünk egy 15 percig érvényes hivatkozást, amellyel új jelszót állíthat be vagy aktiválhatja első belépését.</p>
          <div className="mt-7"><PasswordRecoveryForm /></div>
          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground"><Link href="/belepes" className="font-bold text-primary underline underline-offset-4">Vissza a belépéshez</Link></p>
        </div>
      </section>
    </AppShell>
  )
}
