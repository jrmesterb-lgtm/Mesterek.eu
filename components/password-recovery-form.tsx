'use client'

import { FormEvent, useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'

export function PasswordRecoveryForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(form.get('email') || '').trim().toLowerCase(),
          redirectTo: '/uj-jelszo',
        }),
      })
      if (!response.ok) {
        setError(response.status === 429 ? 'Túl sok próbálkozás. Kérjük, próbálja újra később.' : 'A kérés most nem küldhető el. Kérjük, próbálja újra később.')
        return
      }
      setMessage('Ha az e-mail-cím szerepel a rendszerünkben, elküldtük a helyreállítási hivatkozást.')
      event.currentTarget.reset()
    } catch {
      setError('A helyreállítási szolgáltatás átmenetileg nem érhető el.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-describedby={error ? 'recovery-error' : message ? 'recovery-message' : undefined}>
      <label className="flex flex-col gap-2">
        <span className="field-label">E-mail-cím</span>
        <input name="email" type="email" autoComplete="email" className="field-input" required autoFocus />
      </label>
      {message && <p id="recovery-message" role="status" className="rounded-lg bg-secondary p-4 font-bold leading-relaxed text-secondary-foreground">{message}</p>}
      {error && <p id="recovery-error" role="alert" className="font-bold text-destructive">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
        {pending ? 'Küldés…' : 'Helyreállítási hivatkozás küldése'}
      </button>
    </form>
  )
}
