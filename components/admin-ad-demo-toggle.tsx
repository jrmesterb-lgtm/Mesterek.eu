'use client'

import { Megaphone } from 'lucide-react'
import { useAdDemo } from '@/components/ad-demo-context'

export function AdminAdDemoToggle() {
  const { isAdDemoActive, setAdDemoActive, hydrated } = useAdDemo()

  return (
    <section aria-labelledby="ad-demo-title" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isAdDemoActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            <Megaphone className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-black text-primary">Bemutató mód</p>
            <h2 id="ad-demo-title" className="text-lg font-bold tracking-tight">Hirdetési felületek (Demo)</h2>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Natív B2B hirdetések megjelenítése a keresőben. A hirdetések csak bemutató célt szolgálnak, és minden látogató számára láthatóvá válnak.
            </p>
            <p className={`text-sm font-bold ${isAdDemoActive ? 'text-primary' : 'text-muted-foreground'}`} aria-live="polite">
              {!hydrated ? 'Betöltés…' : isAdDemoActive ? 'Bekapcsolva' : 'Kikapcsolva'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Natív B2B hirdetések megjelenítése a keresőben"
          aria-checked={isAdDemoActive}
          onClick={() => setAdDemoActive(!isAdDemoActive)}
          disabled={!hydrated}
          className={`relative h-8 w-14 shrink-0 rounded-full border p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${isAdDemoActive ? 'border-primary bg-primary' : 'border-border bg-muted'}`}
        >
          <span aria-hidden="true" className={`block size-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out ${isAdDemoActive ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    </section>
  )
}
