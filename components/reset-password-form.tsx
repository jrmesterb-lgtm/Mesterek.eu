'use client'

import { FormEvent, useState } from 'react'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmation = String(form.get('confirmation') || '')

    if (password !== confirmation) {
      setError('A két jelszó nem egyezik.')
      setPending(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password, token }),
      })
      if (!response.ok) {
        setError('A hivatkozás érvénytelen vagy lejárt. Kérjen új helyreállítási hivatkozást.')
        return
      }
      router.push('/belepes?reset=success')
      router.refresh()
    } catch {
      setError('A jelszó most nem módosítható. Kérjük, próbálja újra később.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-describedby={error ? 'reset-error' : undefined}>
      <label className="flex flex-col gap-2">
        <span className="field-label">Új jelszó</span>
        <input name="password" type="password" autoComplete="new-password" className="field-input" required minLength={12} maxLength={128} autoFocus />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">Új jelszó ismét</span>
        <input name="confirmation" type="password" autoComplete="new-password" className="field-input" required minLength={12} maxLength={128} />
      </label>
      <p className="text-sm leading-relaxed text-muted-foreground">A jelszó legalább 12 karakterből álljon.</p>
      {error && <p id="reset-error" role="alert" className="font-bold text-destructive">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
        {pending ? 'Mentés…' : 'Új jelszó mentése'}
      </button>
    </form>
  )
}
