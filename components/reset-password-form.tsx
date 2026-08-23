'use client'

import { FormEvent, useState } from 'react'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { completePasswordReset } from '@/app/actions/password-reset'
import { PasswordInput } from '@/components/password-input'

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
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
      const result = await completePasswordReset(form)
      if (!result.success) {
        setError(result.error || 'A hivatkozás érvénytelen vagy lejárt. Kérjen új helyreállítási hivatkozást.')
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
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <label className="flex flex-col gap-2">
        <span className="field-label">Új jelszó</span>
        <PasswordInput name="password" autoComplete="new-password" required minLength={12} maxLength={128} autoFocus />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">Új jelszó ismét</span>
        <PasswordInput name="confirmation" autoComplete="new-password" required minLength={12} maxLength={128} />
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
