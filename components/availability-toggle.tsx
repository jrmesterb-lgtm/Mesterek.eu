'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { setProfessionalAvailability } from '@/app/dashboard/actions'

export function AvailabilityToggle({ initialAvailable }: { initialAvailable: boolean }) {
  const [available, setAvailable] = useState(initialAvailable)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function toggle() {
    const previous = available
    const next = !previous
    setAvailable(next)
    setError('')
    startTransition(async () => {
      try {
        const result = await setProfessionalAvailability(next)
        if (!result.success) {
          setAvailable(previous)
          setError(result.message)
        }
      } catch {
        setAvailable(previous)
        setError('Az állapot frissítése nem sikerült. Próbálja újra.')
      }
    })
  }

  const Icon = available ? CheckCircle2 : Clock3

  return <section aria-labelledby="availability-title" className={`rounded-3xl border p-5 shadow-[0_1px_2px_rgb(18_32_51/0.05),0_10px_28px_rgb(18_32_51/0.1)] ${available ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-amber-600/40 bg-amber-500/10'}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${available ? 'bg-emerald-600 text-primary-foreground' : 'bg-amber-500 text-foreground'}`}><Icon className="size-6" aria-hidden="true" /></span>
        <div><h2 id="availability-title" className="text-xl font-black text-foreground">Aktuális elérhetőség</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Egy kattintással jelezheti az ügyfeleknek, hogy tud-e új munkát vállalni.</p></div>
      </div>
      <button type="button" role="switch" aria-checked={available} onClick={toggle} disabled={pending} className={`inline-flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl px-5 text-base font-black shadow-md transition-[transform,opacity] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:w-64 ${available ? 'bg-emerald-600 text-primary-foreground' : 'bg-amber-500 text-foreground'}`}>
        <span>{available ? 'Szabad vagyok' : 'Jelenleg elfoglalt'}</span><span aria-hidden="true" className={`relative h-7 w-12 rounded-full bg-background/50 after:absolute after:top-1 after:size-5 after:rounded-full after:bg-foreground after:transition-transform ${available ? 'after:translate-x-6' : 'after:translate-x-1'}`} />
      </button>
    </div>
    <p className="mt-3 text-sm font-bold" aria-live="polite">{pending ? 'Frissítés…' : available ? 'A keresőben Szabad állapottal jelenik meg.' : 'A keresőben Elfoglalt állapottal jelenik meg.'}</p>
    {error && <p role="alert" className="mt-2 text-sm font-bold text-destructive">{error}</p>}
  </section>
}
