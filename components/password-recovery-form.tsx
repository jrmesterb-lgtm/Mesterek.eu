'use client'

import { useActionState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import {
  sendPasswordResetEmail,
  type PasswordResetActionResult,
} from '@/app/actions/password-reset'

const initialPasswordResetState: PasswordResetActionResult = {
  success: false,
}

export function PasswordRecoveryForm() {
  const [state, formAction, pending] = useActionState(
    sendPasswordResetEmail,
    initialPasswordResetState,
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
      aria-describedby={state.error ? 'recovery-error' : state.message ? 'recovery-message' : undefined}
    >
      <label className="flex flex-col gap-2">
        <span className="field-label">E-mail-cím</span>
        <input name="email" type="email" autoComplete="email" className="field-input" required autoFocus />
      </label>
      {state.success && state.message && (
        <p id="recovery-message" role="status" className="rounded-lg bg-secondary p-4 font-bold leading-relaxed text-secondary-foreground">
          {state.message}
        </p>
      )}
      {!state.success && state.error && (
        <p id="recovery-error" role="alert" className="font-bold text-destructive">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
        {pending ? 'Küldés…' : 'Helyreállítási hivatkozás küldése'}
      </button>
    </form>
  )
}
