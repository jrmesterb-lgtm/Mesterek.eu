import type { Metadata } from 'next'
import { ProfileShareCard } from '@/components/profile-share-card'

// TEMPORARY: standalone design preview so the "Profi Megjelenés" card can be
// reviewed while 2FA blocks dashboard access. Safe to delete after review.
export const metadata: Metadata = {
  title: 'Profi Megjelenés – dizájn előnézet',
  robots: { index: false, follow: false },
}

export default function MarketingToolkitPreviewPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 [&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:shadow-md [&_[data-slot=card]]:ring-0 [&_[data-slot=card]]:[--card-spacing:--spacing(6)]">
        <div>
          <p className="text-sm font-bold text-muted-foreground">Dizájn előnézet</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">Profi Megjelenés</h1>
          <p className="mt-1 text-muted-foreground">Szerezz több ügyfelet a saját adatlapoddal.</p>
        </div>
        <ProfileShareCard profileUrl="https://mesterek.eu/szakemberek/2454" />
      </div>
    </main>
  )
}
