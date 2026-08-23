'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, LoaderCircle, ShieldCheck } from 'lucide-react'
import { startRegistration, type RegistrationState } from '@/app/regisztracio/actions'
import { RegistrationLocationFields } from '@/components/registration-location-fields'
import { PaymentTrustBadges } from '@/components/payment-trust-badges'
import { GdprConsentDialog } from '@/components/gdpr-consent-dialog'
import { TurnstileWidget } from '@/components/turnstile-widget'

const initialState: RegistrationState = {}

const EMAIL_REGEX = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i
const PHONE_REGEX = /^(?:\+36|06)\d{8,9}$/
const REQUIRED_MESSAGE = 'Ez a mező kötelező'
const ACCEPTED_MESSAGE = 'A folytatáshoz el kell fogadnia a feltételeket.'

// Every required field, listed in the visual top-to-bottom order so we can
// scroll to the FIRST invalid one on a failed submit. The location fields
// (profession/county/city/zipCode) each expose a name-bearing form element via
// ResponsiveSelect (hidden input on mobile, Radix hidden control on desktop),
// so form.elements can read them all the same way.
const REQUIRED_FIELDS = ['name', 'email', 'phone', 'profession', 'county', 'city', 'zipCode', 'description', 'taxType', 'taxNumber', 'billingName', 'billingAddress', 'accepted'] as const

function validateEmail(value: string) {
  return EMAIL_REGEX.test(value.trim()) ? undefined : 'Kérjük, valós formátumú e-mail címet adjon meg!'
}

function validatePhone(value: string) {
  return PHONE_REGEX.test(value.trim()) ? undefined : 'Érvényes telefonszámot adjon meg (pl. +36301234567)!'
}

// Submit-time validation for a single required field, read straight from the
// live form so it works for controlled inputs AND the location selects.
function validateRequiredField(name: string, form: HTMLFormElement): string | undefined {
  if (name === 'accepted') {
    const checkbox = form.elements.namedItem('accepted')
    return checkbox instanceof HTMLInputElement && checkbox.checked ? undefined : ACCEPTED_MESSAGE
  }
  const control = form.elements.namedItem(name)
  const element = control instanceof RadioNodeList ? control[0] : control
  const value = element && 'value' in element ? String((element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value) : ''
  if (!value.trim()) return REQUIRED_MESSAGE
  if (name === 'email') return validateEmail(value)
  if (name === 'phone') return validatePhone(value)
  return undefined
}

// Scroll to (and focus) a field by name. Location selects render their
// name-bearing element as a hidden input with no layout box, so when the target
// has no offset parent we scroll its visible label/fieldset wrapper instead.
function scrollToField(form: HTMLFormElement, name: string) {
  const control = form.elements.namedItem(name)
  const element = control instanceof RadioNodeList ? control[0] : control
  if (!(element instanceof HTMLElement)) return
  const target = element.offsetParent === null ? (element.closest('label, fieldset') ?? element) : element
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  element.focus({ preventScroll: true })
}

export function RegistrationForm({ cancelled }: { cancelled: boolean }) {
  const [state, action, pending] = useActionState(startRegistration, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set())
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({})

  // Controlled field state. A Server Action round-trip through useActionState
  // remounts the form's uncontrolled inputs and wipes typed data on a validation
  // error. Binding every field to this state — and re-seeding it from the values
  // the action echoes back — keeps the user's input intact across that
  // re-render. We never reset it here; a fully successful submit redirects away.
  const [values, setValues] = useState<Record<string, string>>({})
  const [isEmergency247, setIsEmergency247] = useState(false)
  const [billingInterval, setBillingInterval] = useState('month')
  const [accepted, setAccepted] = useState(false)

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  useEffect(() => {
    const echoed = state.values
    if (!echoed) return
    setValues((current) => ({ ...current, ...Object.fromEntries(Object.entries(echoed).filter(([key]) => !['isEmergency247', 'billingInterval', 'accepted'].includes(key))) as Record<string, string> }))
    if (echoed.isEmergency247 !== undefined) setIsEmergency247(echoed.isEmergency247 === 'on')
    if (echoed.billingInterval) setBillingInterval(echoed.billingInterval)
    if (echoed.accepted !== undefined) setAccepted(echoed.accepted === 'on')
  }, [state.values])
  const serverErrors = Object.fromEntries(Object.entries(state.fieldErrors ?? {}).filter(([name]) => !correctedFields.has(name)))
  const errors = { ...serverErrors, ...Object.fromEntries(Object.entries(clientErrors).filter(([, message]) => message)) }

  useEffect(() => {
    setCorrectedFields(new Set())
  }, [state.fieldErrors])

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    // Scroll to the first server-reported error, following the same visual field
    // order used for client validation so the target is the topmost one.
    const firstError = REQUIRED_FIELDS.find((name) => state.fieldErrors?.[name]) ?? Object.keys(state.fieldErrors ?? {})[0]
    if (!firstError) return
    scrollToField(form, firstError)
  }, [state.fieldErrors])

  function clearCorrectedField(event: React.FormEvent<HTMLFormElement>) {
    const field = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    if (!field.name) return
    // Re-validate email/phone live so a corrected value clears its inline error immediately.
    if (field.name === 'email' || field.name === 'phone') {
      const message = field.name === 'email' ? validateEmail(field.value) : validatePhone(field.value)
      setClientErrors((current) => ({ ...current, [field.name]: message }))
    } else if (clientErrors[field.name]) {
      // A submit-time required error is showing for this field — clear it as soon
      // as the user supplies a value (checked, for the accept checkbox).
      const filled = field instanceof HTMLInputElement && field.type === 'checkbox' ? field.checked : Boolean(field.value.trim())
      if (filled) setClientErrors((current) => ({ ...current, [field.name]: undefined }))
    }
    if (!state.fieldErrors?.[field.name]) return
    setCorrectedFields((current) => new Set(current).add(field.name))
  }

  function validateContactField(event: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = event.target
    const message = name === 'email' ? validateEmail(value) : validatePhone(value)
    setClientErrors((current) => ({ ...current, [name]: message }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    // Validate EVERY required field up front so a single submit surfaces all
    // missing/invalid fields at once (red border + inline message), instead of
    // only blocking on email/phone and hiding the rest until later submits.
    const nextErrors: Record<string, string | undefined> = {}
    for (const name of REQUIRED_FIELDS) nextErrors[name] = validateRequiredField(name, form)
    const firstInvalid = REQUIRED_FIELDS.find((name) => nextErrors[name])
    if (firstInvalid) {
      event.preventDefault()
      setClientErrors((current) => ({ ...current, ...nextErrors }))
      scrollToField(form, firstInvalid)
    }
  }

  return <form ref={formRef} action={action} noValidate onSubmit={handleSubmit} onInput={clearCorrectedField} onChange={clearCorrectedField} className="mt-8 flex flex-col gap-7">
    {cancelled && <div className="rounded-xl border-2 border-accent bg-accent/20 p-5 font-bold" role="status">Megszakította a fizetési folyamatot. A megadott adatokkal újra megpróbálhatja.</div>}
    {state.error && <div className="rounded-xl border-2 border-destructive bg-card p-5 font-bold text-destructive" role="alert">{state.error}</div>}
    <fieldset className="surface"><legend className="float-left mb-4 w-full px-2 text-2xl font-black leading-snug text-primary">1. Szakmai és kapcsolati adatok</legend><div className="clear-both grid gap-5 md:grid-cols-2">
      <Field label="Teljes név" name="name" error={errors.name} autoComplete="name" required value={values.name ?? ''} onChange={(v) => setValue('name', v)} />
      <Field label="E-mail-cím" name="email" type="email" error={errors.email} autoComplete="email" required onBlur={validateContactField} value={values.email ?? ''} onChange={(v) => setValue('email', v)} />
      <Field label="Telefonszám" name="phone" type="tel" error={errors.phone} autoComplete="tel" placeholder="+36 30 123 4567" required onBlur={validateContactField} value={values.phone ?? ''} onChange={(v) => setValue('phone', v)} />
      <RegistrationLocationFields professionError={errors.profession} countyError={errors.county} cityError={errors.city} zipError={errors.zipCode} initialProfession={values.profession ?? ''} initialCounty={values.county ?? ''} initialCity={values.city ?? ''} initialZipCode={values.zipCode ?? ''} />
      <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-border bg-secondary p-5 md:col-span-2"><input type="checkbox" name="isEmergency247" checked={isEmergency247} onChange={(event) => setIsEmergency247(event.target.checked)} className="mt-1 size-6 shrink-0 accent-primary" /><span><strong className="block text-lg">0–24 órás ügyeletet vállalok</strong><span className="mt-1 block leading-relaxed text-muted-foreground">Az adatlapja a választott szakmában is megmarad, és emellett automatikusan megjelenik az SOS Gyorsszolgálat 0–24 órás találatai között.</span></span></label>
      <label className="flex flex-col gap-2 md:col-span-2"><span className="field-label">Rövid bemutatkozás</span><textarea name="description" value={values.description ?? ''} onChange={(event) => setValue('description', event.target.value)} className={`field-input min-h-36 ${invalidClass(errors.description)}`} minLength={20} maxLength={600} required placeholder="Írja le tapasztalatát és a vállalt munkákat." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} /><FieldError name="description" message={errors.description} /></label>
    </div></fieldset>
    <fieldset className="surface"><legend className="float-left mb-2 w-full px-2 text-2xl font-black leading-snug text-primary">2. Adózási és számlázási adatok</legend><p className="clear-both break-words rounded-xl bg-secondary p-4 text-lg leading-relaxed text-muted-foreground">Ezek az adatok nem jelennek meg nyilvánosan. A szolgáltatás az Európai Unión belüli, vállalkozások közötti (B2B) ügylet. A jogszabályi feltételek teljesülése és érvényes magyar közösségi adószám esetén a fordított adózás szabályai alkalmazhatók (reverse charge).</p><div className="mt-5 grid gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-2"><span className="field-label">Adózási forma</span><select name="taxType" className={`field-input ${invalidClass(errors.taxType)}`} required value={values.taxType ?? ''} onChange={(event) => setValue('taxType', event.target.value)} aria-invalid={Boolean(errors.taxType)} aria-describedby={errors.taxType ? 'taxType-error' : undefined}><option value="" disabled>Válasszon</option><option value="egyéni vállalkozó">Egyéni vállalkozó</option><option value="adószámos magánszemély">Adószámos magánszemély</option><option value="gazdasági társaság">Gazdasági társaság</option></select><FieldError name="taxType" message={errors.taxType} /></label>
      <Field label="Magyar közösségi adószám" name="taxNumber" error={errors.taxNumber} placeholder="HU12345678" pattern="HU[0-9]{8}" title="Formátum: HU12345678" required value={values.taxNumber ?? ''} onChange={(v) => setValue('taxNumber', v)} />
      <Field label="Számlázási név" name="billingName" error={errors.billingName} autoComplete="organization" required value={values.billingName ?? ''} onChange={(v) => setValue('billingName', v)} />
      <Field label="Számlázási cím" name="billingAddress" error={errors.billingAddress} autoComplete="street-address" required value={values.billingAddress ?? ''} onChange={(v) => setValue('billingAddress', v)} />
    </div></fieldset>
    <section className="surface overflow-visible border-primary p-5 sm:p-6" aria-labelledby="listing-title"><div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row"><ShieldCheck className="size-8 shrink-0 text-primary sm:mt-1" aria-hidden="true" /><div className="min-w-0 flex-1"><h2 id="listing-title" className="text-balance text-2xl font-black leading-snug text-primary">60 napos Kiemelt Mester próbaidőszak</h2><div className="mt-3 flex min-w-0 flex-col gap-3"><p className="break-words text-base leading-relaxed sm:text-lg">A regisztráció után 60 napig díjmentesen használhatja a Kiemelt Mester csomagot. A próbaidőszak indításához érvényes fizetési mód szükséges, de az első terhelés csak a 60 nap letelte után történik.</p><p className="break-words text-base leading-relaxed text-muted-foreground">A próbaidőszak után az előfizetés a választott csomaggal automatikusan folytatódik: havi nettó 4 990 Ft vagy éves nettó 49 990 Ft. A próbaidőszak alatt bármikor, kötbér nélkül lemondható.</p><fieldset className={`mt-1 flex flex-col gap-3 rounded-xl ${errors.billingInterval ? 'border-2 border-destructive p-3' : ''}`} aria-invalid={Boolean(errors.billingInterval)} aria-describedby={errors.billingInterval ? 'billingInterval-error' : undefined}><legend className="field-label">Válasszon számlázási időszakot</legend><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card p-4"><input type="radio" name="billingInterval" value="month" className="size-5 accent-primary" checked={billingInterval === 'month'} onChange={() => setBillingInterval('month')} required /><span><strong className="block">Havi előfizetés</strong><span className="text-sm text-muted-foreground">60 nap után nettó 4 990 Ft / hó</span></span></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card p-4"><input type="radio" name="billingInterval" value="year" className="size-5 accent-primary" checked={billingInterval === 'year'} onChange={() => setBillingInterval('year')} required /><span className="min-w-0"><strong className="block">Éves előfizetés</strong><span className="block text-sm text-muted-foreground">60 nap után nettó 49 990 Ft / év</span><span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-green-800">-16% (2 hónap ajándék!)</span></span></label><FieldError name="billingInterval" message={errors.billingInterval} /></fieldset></div></div></div></section>
    <PaymentTrustBadges />
    <div className={`flex items-start gap-4 rounded-xl border-2 bg-card p-5 ${errors.accepted ? 'border-destructive' : 'border-border'}`}><input id="accepted" type="checkbox" name="accepted" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 size-6 shrink-0 accent-primary" required aria-invalid={Boolean(errors.accepted)} aria-describedby={errors.accepted ? 'accepted-error' : undefined} /><div className="leading-relaxed"><label htmlFor="accepted" className="cursor-pointer">Elfogadom az Általános Szerződési Feltételeket (</label><Link href="/aszf" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-4">ÁSZF</Link><span>) és az </span><GdprConsentDialog /><span>. Tudomásul veszem, hogy a 60 napos próbaidőszak után a választott Kiemelt Mester előfizetés automatikusan fizetőssé válik, ha addig nem mondom le.</span><FieldError name="accepted" message={errors.accepted} /></div></div>
    <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"><label>Ne töltse ki ezt a mezőt<input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" /></label></div>
    <TurnstileWidget />
    <button className="btn-accent w-full md:w-auto md:self-end" disabled={pending} type="submit">{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BadgeCheck aria-hidden="true" />}{pending ? 'Próbaidőszak indítása…' : '60 napos próbaidőszak indítása'}</button>
  </form>
}

function invalidClass(message?: string) {
  return message ? 'border-destructive ring-2 ring-destructive/20 focus:border-destructive focus:ring-destructive/25' : ''
}

function FieldError({ name, message }: { name: string; message?: string }) {
  if (!message) return null
  return <span id={`${name}-error`} role="alert" className="text-sm font-bold leading-relaxed text-destructive">{message}</span>
}

function Field({ label, name, type = 'text', error, value, onChange, ...props }: { label: string; name: string; type?: string; error?: string; value: string; onChange: (value: string) => void; [key: string]: unknown }) {
  return <label className="flex flex-col gap-2"><span className="field-label">{label}</span><input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`field-input ${invalidClass(error)}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} /><FieldError name={name} message={error} /></label>
}
