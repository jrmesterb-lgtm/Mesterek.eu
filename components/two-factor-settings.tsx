'use client'

import { useState } from 'react'
import { LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

function authErrorMessage(error: { message?: string } | null, fallback: string) {
  if (!error) return fallback
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('password')) return 'A megadott jelszó nem megfelelő.'
  if (message.includes('attempt') || message.includes('rate')) return 'Túl sok próbálkozás. Próbálja újra később.'
  return fallback
}

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'password' | 'verify'>('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  function reset() {
    setStep('password')
    setPassword('')
    setCode('')
    setError('')
    setNotice('')
    setPending(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && pending) return
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  async function enableTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password) return
    setPending(true)
    setError('')

    const { data, error: requestError } = await authClient.twoFactor.enable({ password, method: 'otp' })

    if (requestError || !data || data.method !== 'otp') {
      setPending(false)
      setError(authErrorMessage(requestError, 'A kétlépcsős azonosítás előkészítése nem sikerült.'))
      return
    }

    // Enabling OTP only flips the flag; the code must be triggered explicitly.
    const { error: sendError } = await authClient.twoFactor.sendOtp({ trustDevice: false })
    setPending(false)

    if (sendError) {
      setError(authErrorMessage(sendError, 'A hatjegyű kód elküldése nem sikerült. Kérjük, próbálja újra.'))
      return
    }

    setPassword('')
    setStep('verify')
    setNotice('Elküldtük a hatjegyű kódot a hitelesített e-mail-címére.')
  }

  async function verifyTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length !== 6) {
      setError('Adja meg az e-mailben kapott hatjegyű kódot.')
      return
    }

    setPending(true)
    setError('')
    const { error: requestError } = await authClient.twoFactor.verifyOtp({ code, trustDevice: false })
    setPending(false)

    if (requestError) {
      setError(authErrorMessage(requestError, 'A megadott ellenőrző kód nem megfelelő vagy lejárt.'))
      return
    }

    setOpen(false)
    reset()
    router.refresh()
  }

  async function resendCode() {
    setPending(true)
    setError('')
    setNotice('')
    const { error: requestError } = await authClient.twoFactor.sendOtp({ trustDevice: false })
    setPending(false)
    if (requestError) {
      setError(authErrorMessage(requestError, 'A kód újraküldése nem sikerült.'))
      return
    }
    setCode('')
    setNotice('Új ellenőrző kódot küldtünk az e-mail-címére.')
  }

  async function disableTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password) return
    setPending(true)
    setError('')
    const { error: requestError } = await authClient.twoFactor.disable({ password })
    setPending(false)

    if (requestError) {
      setError(authErrorMessage(requestError, 'A kétlépcsős azonosítás kikapcsolása nem sikerült.'))
      return
    }

    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant={enabled ? 'outline' : 'default'} />}>
        {enabled ? 'Kikapcsolás' : 'Bekapcsolás'}
      </DialogTrigger>
      <DialogContent className="border border-border bg-background opacity-100 shadow-2xl backdrop-blur-none sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{enabled ? 'Kétlépcsős azonosítás kikapcsolása' : 'E-mailes kétlépcsős azonosítás'}</DialogTitle>
          <DialogDescription>
            {enabled
              ? 'A művelet után a fiókba ismét csak jelszóval lehet belépni.'
              : step === 'password'
                ? 'Belépéskor a jelszó után egy e-mailben kapott hatjegyű kódot is kérünk.'
                : 'Adja meg az e-mailben kapott hatjegyű kódot a védelem bekapcsolásához.'}
          </DialogDescription>
        </DialogHeader>

        {(enabled || step === 'password') && (
          <form onSubmit={enabled ? disableTwoFactor : enableTwoFactor} className="flex flex-col gap-5">
            {!enabled && (
              <div className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                <MailCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-muted-foreground">A kódot minden belépéskor a hitelesített e-mail-címére küldjük. A kód 5 percig érvényes.</p>
              </div>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">Jelenlegi jelszó</span>
              <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required autoFocus disabled={pending} />
            </label>
            {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>Mégse</Button>
              <Button type="submit" variant={enabled ? 'destructive' : 'default'} disabled={pending || !password}>
                {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
                {pending ? 'Feldolgozás…' : enabled ? 'Kikapcsolás megerősítése' : 'Kód küldése'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {!enabled && step === 'verify' && (
          <form onSubmit={verifyTwoFactor} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">Hatjegyű ellenőrző kód</span>
              <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode} disabled={pending} autoFocus aria-invalid={Boolean(error)}>
                <InputOTPGroup>{[0, 1, 2].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>{[3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
              </InputOTP>
            </label>
            {notice && <p role="status" className="text-sm font-bold text-primary">{notice}</p>}
            {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
            <button type="button" onClick={resendCode} disabled={pending} className="self-start text-sm font-bold text-primary underline underline-offset-4 disabled:opacity-60">Kód újraküldése</button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>Mégse</Button>
              <Button type="submit" disabled={pending || code.length !== 6}>
                {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
                {pending ? 'Ellenőrzés…' : 'Ellenőrzés és bekapcsolás'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
