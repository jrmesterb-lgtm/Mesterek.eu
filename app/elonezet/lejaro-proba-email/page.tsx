import type { Metadata } from 'next'
import { TrialEndingEmailPreview } from '@/components/trial-ending-email-preview'

// TEMPORARY: standalone design preview of the "Trial Ending Soon" email.
// Safe to delete after review.
export const metadata: Metadata = {
  title: 'Lejáró próbaidőszak email – dizájn előnézet',
  robots: { index: false, follow: false },
}

export default function TrialEndingEmailPreviewPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <div>
          <p className="text-sm font-bold text-muted-foreground">Dizájn előnézet</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">Lejáró próbaidőszak – emlékeztető email</h1>
          <p className="mt-1 text-muted-foreground">Így néz ki az értesítő, amit a szakember 3 nappal a próbaidőszak vége előtt kap.</p>
        </div>
        <TrialEndingEmailPreview />
      </div>
    </main>
  )
}
