import Link from 'next/link'
import { BriefcaseBusiness, Crown, MapPin, Phone, ShieldCheck } from 'lucide-react'

export function SubscriptionComparison({ ctaHref = '#elofizetes' }: { ctaHref?: string }) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-md" aria-labelledby="comparison-title">
      <h3 id="comparison-title" className="text-2xl font-black text-primary">Mit kapsz a Kiemelt Mester előfizetéssel?</h3>
      <p className="mt-2 text-muted-foreground">Nézd meg a különbséget! Így jelenik meg az adatlapod az ügyfeleknek a keresőben.</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Alap Profil (Ingyenes)</p>
          <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-muted/50 p-4" aria-label="Alap profil előnézete a keresőben">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-border/60 text-muted-foreground" aria-hidden="true">
                <BriefcaseBusiness className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-muted-foreground">Szabó Péter</p>
                <p className="truncate text-sm text-muted-foreground">Villanyszerelő</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />Budapest
            </p>
            <span className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-border/40 px-3 text-sm font-bold text-muted-foreground">
              Adatlap megtekintése
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary">
            <Crown className="size-4 shrink-0 text-accent-foreground" aria-hidden="true" />Kiemelt Mester Profil
          </p>
          <div className="relative flex min-w-0 flex-col gap-4 rounded-xl border-2 border-accent bg-card p-4 pt-14 shadow-lg" aria-label="Kiemelt Mester profil előnézete a keresőben">
            <span className="sos-badge absolute right-3 top-3 z-10">
              <span className="sos-dot" aria-hidden="true" />SOS Ügyelet
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-md" aria-hidden="true">SZP</span>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-primary">Szabó Péter</p>
                <p className="truncate text-sm font-bold text-foreground">Villanyszerelő</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />Ellenőrzött
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">
                <Crown className="size-4" aria-hidden="true" />Kiemelt Mester
              </span>
            </div>
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />1052 Budapest, Deák Ferenc utca 12.
            </p>
            <span className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-base font-black text-white shadow-md">
              <Phone className="size-5 shrink-0" aria-hidden="true" />Hívás azonnal
            </span>
          </div>
        </div>
      </div>

      <Link href={ctaHref} className="btn-primary mt-6 w-full">
        Kérem a Kiemelt Mester csomagot – nettó 4 990 Ft / hó
      </Link>
    </section>
  )
}
