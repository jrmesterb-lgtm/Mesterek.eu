'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, KeyRound, LoaderCircle, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react'
import { PasswordInput } from '@/components/password-input'

export function AdminLogin() {
  const [step, setStep] = useState<'credentials' | 'otp_pending'>('credentials')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>, endpoint: string) {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const payload = endpoint.endsWith('login')
      ? { email: data.get('email'), password: data.get('password') }
      : { code: data.get('code') }
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { error?: string; status?: string }
      if (!response.ok) {
        setError(result.error || 'A kérés nem teljesíthető.')
        if (result.status === 'credentials') setStep('credentials')
      } else if (result.status === 'otp_pending') setStep('otp_pending')
      else if (result.status === 'authenticated') window.location.assign('/admin')
    } catch {
      setError('A kapcsolat megszakadt. Kérjük, próbálja újra.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="w-full max-w-md" aria-labelledby="admin-login-title">
      <Link href="/" className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 font-bold text-background transition hover:bg-background/10 hover:text-accent focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"><ArrowLeft className="size-5" aria-hidden="true" />Vissza a főoldalra</Link>
      <div className="mb-8 flex items-center justify-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ShieldCheck aria-hidden="true" /></span><div><p className="text-sm font-black uppercase tracking-widest text-accent">Mesterek</p><p className="font-black text-background">Admin Panel</p></div></div>
      {step === 'credentials' ? (
        <form onSubmit={(event) => submit(event, '/api/admin/login')} className="rounded-2xl border border-muted-foreground bg-card p-6 text-card-foreground shadow-2xl md:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><LockKeyhole aria-hidden="true" /></div>
          <h1 id="admin-login-title" className="mt-6 text-balance text-3xl font-black tracking-tight">Biztonságos belépés</h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">Adja meg az admin e-mail-címet és jelszót. Sikeres ellenőrzés után e-mailben küldjük a belépési kódot.</p>
          <div className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2"><span className="field-label">Admin e-mail</span><input name="email" type="email" autoComplete="username" className="field-input" placeholder="admin@domain.com" required autoFocus aria-invalid={Boolean(error)} /></label><label className="flex flex-col gap-2"><span className="field-label">Admin jelszó</span><PasswordInput name="password" autoComplete="current-password" required aria-invalid={Boolean(error)} /></label></div>
          {error && <p className="mt-4 font-bold text-destructive" role="alert">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}{pending ? 'Kód küldése…' : 'Tovább a kódhoz'}</button>
        </form>
      ) : (
        <form onSubmit={(event) => submit(event, '/api/admin/verify-otp')} className="rounded-2xl border border-muted-foreground bg-card p-6 text-card-foreground shadow-2xl md:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><MailCheck aria-hidden="true" /></div>
          <h1 id="admin-login-title" className="mt-6 text-balance text-3xl font-black tracking-tight">E-mailes ellenőrzés</h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">A 6 jegyű kódot elküldtük a rögzített admin e-mail-címre. A kód 10 percig érvényes.</p>
          <label className="mt-6 flex flex-col gap-2"><span className="field-label">6 jegyű kód</span><input name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" className="field-input text-center font-mono text-2xl tracking-[0.35em]" required autoFocus aria-invalid={Boolean(error)} /></label>
          {error && <p className="mt-4 font-bold text-destructive" role="alert">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}{pending ? 'Kód ellenőrzése…' : 'Belépés az adminfelületre'}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm font-bold text-muted">Az admin munkamenet csak a jelszó és az egyszer használatos kód sikeres ellenőrzése után indul el.</p>
    </section>
  )
}
