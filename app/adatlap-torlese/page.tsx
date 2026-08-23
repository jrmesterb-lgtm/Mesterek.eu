import Link from 'next/link'
import { ShieldCheck, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { DeletionRequestForm } from '@/components/deletion-request-form'

export const metadata = {
  title: 'Adatlap törlése | Mesterek',
  description: 'Szakember- vagy cégadatlap végleges törlésének kérése.',
  robots: { index: false, follow: true },
}

export default function DeletionRequestPage() {
  return (
    <AppShell>
      <div className="page-wrap flex justify-center">
        <section className="relative w-full max-w-2xl rounded-2xl border-2 border-border bg-card p-6 pt-20 shadow-sm md:p-10 md:pt-20" aria-labelledby="deletion-title">
          <Link href="/" className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-xl border-2 border-border bg-background text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-4" aria-label="Törlési kérelem bezárása és vissza a kezdőlapra"><X className="size-6" aria-hidden="true" /></Link>
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-8" aria-hidden="true" />
          </div>
          <h1 id="deletion-title" className="mt-6 text-balance text-3xl font-black tracking-tight text-primary md:text-4xl">Adatlap végleges törlésének kérése</h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">Adja meg az adatlaphoz tartozó nevet és e-mail-címet. A kérelmet bizalmasan kezeljük, és az adatokat 24 órán belül eltávolítjuk.</p>
          <DeletionRequestForm />
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm font-bold leading-relaxed text-secondary-foreground">A megadott adatokat kizárólag a törlési kérelem azonosítására és teljesítésére használjuk.</p>
        </section>
      </div>
    </AppShell>
  )
}
