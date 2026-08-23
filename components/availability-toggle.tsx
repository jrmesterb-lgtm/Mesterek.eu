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

  return (
    <section aria-labelledby="availability-title" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${available ? 'bg-emerald-600/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="availability-title" className="text-lg font-bold tracking-tight">Aktuális elérhetőség</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Jelezze az ügyfeleknek, hogy jelenleg tud-e új munkát vállalni.</p>
            <p className={`text-sm font-bold ${available ? 'text-emerald-700' : 'text-muted-foreground'}`} aria-live="polite">
              {pending ? 'Frissítés…' : available ? 'Szabad vagyok' : 'Foglalt'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Aktuális elérhetőség módosítása"
          aria-checked={available}
          onClick={toggle}
          disabled={pending}
          className={`relative h-8 w-14 shrink-0 rounded-full border p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${available ? 'border-emerald-600 bg-emerald-600' : 'border-border bg-muted'}`}
        >
          <span aria-hidden="true" className={`block size-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out ${available ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-destructive">{error}</p>}
    </section>
  )
}
