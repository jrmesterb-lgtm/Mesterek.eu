'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, LoaderCircle, ShieldCheck } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { startRegistration, type RegistrationState } from '@/app/regisztracio/actions'
import { HierarchicalLocationSelector } from '@/components/hierarchical-location-selector'
import { PaymentTrustBadges } from '@/components/payment-trust-badges'

const initialState: RegistrationState = {}

export function RegistrationForm({ cancelled }: { cancelled: boolean }) {
  const [state, action, pending] = useActionState(startRegistration, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set())
  const errors = Object.fromEntries(Object.entries(state.fieldErrors ?? {}).filter(([name]) => !correctedFields.has(name)))

  useEffect(() => {
    setCorrectedFields(new Set())
  }, [state.fieldErrors])

  useEffect(() => {
    const firstError = Object.keys(state.fieldErrors ?? {})[0]
    if (!firstError) return
    const control = formRef.current?.elements.namedItem(firstError)
    const element = control instanceof RadioNodeList ? control[0] : control
    if (!(element instanceof HTMLElement)) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
    element.focus({ preventScroll: true })
  }, [state.fieldErrors])

  function clearCorrectedField(event: React.FormEvent<HTMLFormElement>) {
    const field = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    if (!field.name || !state.fieldErrors?.[field.name]) return
    setCorrectedFields((current) => new Set(current).add(field.name))
  }

  return <form ref={formRef} action={action} noValidate onInput={clearCorrectedField} onChange={clearCorrectedField} className="mt-8 flex flex-col gap-7">
    {cancelled && <div className="rounded-xl border-2 border-accent bg-accent/20 p-5 font-bold" role="status">Megszakította a fizetési folyamatot. A megadott adatokkal újra megpróbálhatja.</div>}
    {state.error && <div className="rounded-xl border-2 border-destructive bg-card p-5 font-bold text-destructive" role="alert">{state.error}</div>}
    <fieldset className="surface"><legend className="px-2 text-2xl font-black text-primary">1. Szakmai és kapcsolati adatok</legend><div className="mt-5 grid gap-5 md:grid-cols-2">
      <Field label="Teljes név" name="name" error={errors.name} autoComplete="name" required />
      <Field label="E-mail-cím" name="email" type="email" error={errors.email} autoComplete="email" required />
      <Field label="Telefonszám" name="phone" type="tel" error={errors.phone} autoComplete="tel" placeholder="+36 30 123 4567" required />
      <label className="flex flex-col gap-2"><span className="field-label">Szakma</span><select name="profession" className={`field-input ${invalidClass(errors.profession)}`} required defaultValue="" aria-invalid={Boolean(errors.profession)} aria-describedby={errors.profession ? 'profession-error' : undefined}><option value="" disabled>Válasszon szakmát</option>{CATEGORIES.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}</select><FieldError name="profession" message={errors.profession} /></label>
      <HierarchicalLocationSelector countyName="county" cityName="city" zipName="zipCode" required countyError={errors.county} cityError={errors.city} zipError={errors.zipCode} />
      <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-border bg-secondary p-5 md:col-span-2"><input type="checkbox" name="isEmergency247" className="mt-1 size-6 shrink-0 accent-primary" /><span><strong className="block text-lg">0–24 órás ügyeletet vállalok</strong><span className="mt-1 block leading-relaxed text-muted-foreground">Az adatlapja a választott szakmában is megmarad, és emellett automatikusan megjelenik az SOS Gyorsszolgálat 0–24 órás találatai között.</span></span></label>
      <label className="flex flex-col gap-2 md:col-span-2"><span className="field-label">Rövid bemutatkozás</span><textarea name="description" className={`field-input min-h-36 ${invalidClass(errors.description)}`} minLength={20} maxLength={600} required placeholder="Írja le tapasztalatát és a vállalt munkákat." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} /><FieldError name="description" message={errors.description} /></label>
    </div></fieldset>
    <fieldset className="surface"><legend className="px-2 text-2xl font-black text-primary">2. Adózási és számlázási adatok</legend><p className="mt-3 text-lg leading-relaxed text-muted-foreground">Ezek az adatok nem jelennek meg nyilvánosan. A szolgáltatás az Európai Unión belüli, vállalkozások közötti (B2B) ügylet. A jogszabályi feltételek teljesülése és érvényes magyar közösségi adószám esetén a fordított adózás szabályai alkalmazhatók (reverse charge / omvänd skattskyldighet).</p><div className="mt-5 grid gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-2"><span className="field-label">Adózási forma</span><select name="taxType" className={`field-input ${invalidClass(errors.taxType)}`} required defaultValue="" aria-invalid={Boolean(errors.taxType)} aria-describedby={errors.taxType ? 'taxType-error' : undefined}><option value="" disabled>Válasszon</option><option value="egyéni vállalkozó">Egyéni vállalkozó</option><option value="adószámos magánszemély">Adószámos magánszemély</option><option value="gazdasági társaság">Gazdasági társaság</option></select><FieldError name="taxType" message={errors.taxType} /></label>
      <Field label="Magyar közösségi adószám" name="taxNumber" error={errors.taxNumber} placeholder="HU12345678" pattern="HU[0-9]{8}" title="Formátum: HU12345678" required />
      <Field label="Számlázási név" name="billingName" error={errors.billingName} autoComplete="organization" required />
      <Field label="Számlázási cím" name="billingAddress" error={errors.billingAddress} autoComplete="street-address" required />
    </div></fieldset>
    <section className="surface overflow-visible border-primary p-5 sm:p-6" aria-labelledby="listing-title"><div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row"><ShieldCheck className="size-8 shrink-0 text-primary sm:mt-1" aria-hidden="true" /><div className="min-w-0 flex-1"><h2 id="listing-title" className="text-balance text-2xl font-black leading-snug text-primary">90 napos Kiemelt Mester próbaidőszak</h2><div className="mt-3 flex min-w-0 flex-col gap-3"><p className="break-words text-base leading-relaxed sm:text-lg">A regisztráció után 90 napig díjmentesen használhatja a Kiemelt Mester csomagot. A próbaidőszak indításához érvényes fizetési mód szükséges, de az első terhelés csak a 90 nap letelte után történik.</p><p className="break-words text-base leading-relaxed text-muted-foreground">A próbaidőszak után az előfizetés a választott csomaggal automatikusan folytatódik: havi nettó 4 990 Ft vagy éves nettó 54 990 Ft. A próbaidőszak alatt bármikor, kötbér nélkül lemondható.</p><fieldset className={`mt-1 flex flex-col gap-3 rounded-xl ${errors.billingInterval ? 'border-2 border-destructive p-3' : ''}`} aria-invalid={Boolean(errors.billingInterval)} aria-describedby={errors.billingInterval ? 'billingInterval-error' : undefined}><legend className="field-label">Válasszon számlázási időszakot</legend><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card p-4"><input type="radio" name="billingInterval" value="month" className="size-5 accent-primary" defaultChecked required /><span><strong className="block">Havi előfizetés</strong><span className="text-sm text-muted-foreground">90 nap után nettó 4 990 Ft / hó</span></span></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card p-4"><input type="radio" name="billingInterval" value="year" className="size-5 accent-primary" required /><span><strong className="block">Éves előfizetés</strong><span className="text-sm text-muted-foreground">90 nap után nettó 54 990 Ft / év</span></span></label><FieldError name="billingInterval" message={errors.billingInterval} /></fieldset></div></div></div></section>
    <PaymentTrustBadges />
    <div className={`flex items-start gap-4 rounded-xl border-2 bg-card p-5 ${errors.accepted ? 'border-destructive' : 'border-border'}`}><input id="accepted" type="checkbox" name="accepted" className="mt-1 size-6 shrink-0 accent-primary" required aria-invalid={Boolean(errors.accepted)} aria-describedby={errors.accepted ? 'accepted-error' : undefined} /><div className="leading-relaxed"><label htmlFor="accepted" className="cursor-pointer">Elfogadom az Általános Szerződési Feltételeket (</label><Link href="/aszf" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-4">ÁSZF</Link><span>) és az </span><Link href="/adatvedelem" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-4">Adatkezelési Tájékoztatót</Link><span>. Tudomásul veszem, hogy a 90 napos próbaidőszak után a választott Kiemelt Mester előfizetés automatikusan fizetőssé válik, ha addig nem mondom le.</span><FieldError name="accepted" message={errors.accepted} /></div></div>
    <button className="btn-accent w-full md:w-auto md:self-end" disabled={pending} type="submit">{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BadgeCheck aria-hidden="true" />}{pending ? 'Próbaidőszak indítása…' : '90 napos próbaidőszak indítása'}</button>
  </form>
}

function invalidClass(message?: string) {
  return message ? 'border-destructive ring-2 ring-destructive/20 focus:border-destructive focus:ring-destructive/25' : ''
}

function FieldError({ name, message }: { name: string; message?: string }) {
  if (!message) return null
  return <span id={`${name}-error`} role="alert" className="text-sm font-bold leading-relaxed text-destructive">{message}</span>
}

function Field({ label, name, type = 'text', error, ...props }: { label: string; name: string; type?: string; error?: string; [key: string]: unknown }) {
  return <label className="flex flex-col gap-2"><span className="field-label">{label}</span><input name={name} type={type} className={`field-input ${invalidClass(error)}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} /><FieldError name={name} message={error} /></label>
}
