'use client'

import { useActionState } from 'react'
import { CheckCircle2, LoaderCircle, Trash2 } from 'lucide-react'
import { submitDeletionRequest, type DeletionRequestState } from '@/app/adatlap-torlese/actions'

const initialState: DeletionRequestState = {}

export function DeletionRequestForm() {
  const [state, action, pending] = useActionState(submitDeletionRequest, initialState)

  if (state.success) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-primary bg-secondary p-6 text-primary" role="status" tabIndex={-1}>
        <CheckCircle2 className="size-10" aria-hidden="true" />
        <p className="mt-4 text-pretty text-xl font-black leading-relaxed">Köszönjük. Kérését rögzítettük, és 24 órán belül eltávolítjuk adatait a rendszerből.</p>
      </div>
    )
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <div className="hidden" aria-hidden="true"><label htmlFor="deletion-bot-field">Hagyja üresen</label><input id="deletion-bot-field" name="botField" type="text" tabIndex={-1} autoComplete="off" /></div>
      {state.error && <div className="rounded-xl border-2 border-destructive bg-card p-4 font-bold text-destructive" role="alert">{state.error}</div>}
      <label className="flex flex-col gap-2">
        <span className="field-label">Szakember / Cég neve</span>
        <input className="field-input" name="professionalName" autoComplete="organization" minLength={2} maxLength={160} required />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">E-mail cím</span>
        <input className="field-input" name="email" type="email" autoComplete="email" maxLength={254} required />
      </label>
      <button className="btn-accent mt-2 w-full" type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        {pending ? 'Kérés rögzítése…' : 'Kérem az adataim végleges törlését'}
      </button>
    </form>
  )
}
