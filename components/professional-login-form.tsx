'use client'

import { FormEvent, useState } from 'react'
import { LoaderCircle, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function ProfessionalLoginForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(form.get('email') || '').trim().toLowerCase(),
          password: String(form.get('password') || ''),
          callbackURL: '/dashboard',
        }),
      })
      if (!response.ok) {
        setError('A belépés nem sikerült. Ellenőrizze az e-mail-címet és a jelszót.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('A belépési szolgáltatás átmenetileg nem érhető el. Próbálja újra később.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-describedby={error ? 'login-error' : undefined}>
      <label className="flex flex-col gap-2">
        <span className="field-label">E-mail-cím</span>
        <input name="email" type="email" autoComplete="username" className="field-input" required autoFocus />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">Jelszó</span>
        <input name="password" type="password" autoComplete="current-password" className="field-input" required minLength={12} />
      </label>
      <div className="flex justify-end">
        <Link href="/elfelejtett-jelszo" className="text-sm font-bold text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4">
          Elfelejtette jelszavát vagy első belépés?
        </Link>
      </div>
      {error && <p id="login-error" role="alert" className="font-bold text-destructive">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
        {pending ? 'Belépés…' : 'Belépés'}
      </button>
    </form>
  )
}
