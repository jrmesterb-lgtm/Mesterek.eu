'use client'

import { useActionState, useState } from 'react'
import { ArrowLeft, LoaderCircle, LogIn, MailCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { loginProfessional, type ProfessionalLoginState } from '@/app/actions/professional-login'
import { PasswordInput } from '@/components/password-input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { authClient } from '@/lib/auth-client'

const initialLoginState: ProfessionalLoginState = {}

export function ProfessionalLoginForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(loginProfessional, initialLoginState)
  const [code, setCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [notice, setNotice] = useState('Elküldtük a hatjegyű kódot a fiókjához tartozó e-mail-címre.')
  const [verifying, setVerifying] = useState(false)

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length !== 6) {
      setVerificationError('Adja meg az e-mailben kapott hatjegyű kódot.')
      return
    }

    setVerifying(true)
    setVerificationError('')
    const { error } = await authClient.twoFactor.verifyOtp({ code, trustDevice: false })
    setVerifying(false)

    if (error) {
      const message = error.message?.toLowerCase() ?? ''
      setVerificationError(message.includes('attempt') || message.includes('rate')
        ? 'Túl sok sikertelen próbálkozás. Próbálja újra később.'
        : 'A megadott ellenőrző kód nem megfelelő vagy lejárt.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function resendCode() {
    setVerifying(true)
    setVerificationError('')
    setNotice('')
    const { error } = await authClient.twoFactor.sendOtp({ trustDevice: false })
    setVerifying(false)

    if (error) {
      setVerificationError('A kód újraküldése nem sikerült. Próbálja újra később.')
      return
    }

    setCode('')
    setNotice('Új ellenőrző kódot küldtünk az e-mail-címére.')
  }

  function restartLogin() {
    window.location.reload()
  }

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5" aria-describedby={state.error ? 'login-error' : undefined}>
        <label className="flex flex-col gap-2">
          <span className="field-label">E-mail-cím</span>
          <input name="email" type="email" autoComplete="username" className="field-input" required autoFocus />
        </label>
        <label className="flex flex-col gap-2">
          <span className="field-label">Jelszó</span>
          <PasswordInput name="password" autoComplete="current-password" required minLength={12} />
        </label>
        <div className="flex justify-end">
          <Link href="/elfelejtett-jelszo" className="text-sm font-bold text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4">
            Elfelejtette jelszavát vagy első belépés?
          </Link>
        </div>
        {state.error && <p id="login-error" role="alert" className="font-bold text-destructive">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          {pending ? 'Belépés…' : 'Belépés'}
        </button>
      </form>

      <Dialog open={Boolean(state.requiresTwoFactor)}>
        <DialogContent
          className="border border-border bg-background opacity-100 shadow-2xl backdrop-blur-none sm:max-w-md"
          overlayClassName="bg-black/60 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-secondary">
              <MailCheck className="size-5 text-primary" aria-hidden="true" />
            </div>
            <DialogTitle>Kétlépcsős ellenőrzés</DialogTitle>
            <DialogDescription>Adja meg az e-mailben kapott hatjegyű kódot. A kód 5 percig érvényes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={verifyOtp} className="flex flex-col gap-5" aria-describedby={verificationError ? 'login-otp-error' : 'login-otp-status'}>
            <label className="flex flex-col gap-2">
              <span className="field-label">Hatjegyű ellenőrző kód</span>
              <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode} disabled={verifying} autoFocus aria-invalid={Boolean(verificationError)}>
                <InputOTPGroup>{[0, 1, 2].map((index) => <InputOTPSlot key={index} index={index} className="size-11 text-base" />)}</InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>{[3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} className="size-11 text-base" />)}</InputOTPGroup>
              </InputOTP>
            </label>
            {notice && <p id="login-otp-status" role="status" className="text-sm font-bold text-primary">{notice}</p>}
            {verificationError && <p id="login-otp-error" role="alert" className="text-sm font-bold text-destructive">{verificationError}</p>}
            <button type="button" onClick={resendCode} disabled={verifying} className="self-start text-sm font-bold text-primary underline underline-offset-4 disabled:opacity-60">Kód újraküldése</button>
            <button type="submit" disabled={verifying || code.length !== 6} className="btn-primary w-full">
              {verifying ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
              {verifying ? 'Ellenőrzés…' : 'Kód ellenőrzése'}
            </button>
            <button type="button" onClick={restartLogin} disabled={verifying} className="flex items-center justify-center gap-2 text-sm font-bold text-primary underline underline-offset-4">
              <ArrowLeft className="size-4" aria-hidden="true" /> Másik fiókkal lépek be
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
