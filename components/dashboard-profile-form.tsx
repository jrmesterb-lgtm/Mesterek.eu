'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { updateProfile } from '@/app/dashboard/actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES } from '@/lib/constants'
import { initialProfileActionState } from '@/lib/profile-schema'

type Profile = {
  name: string
  billingName: string
  email: string | null
  phone: string
  profession: string
  description: string
  isEmergency247: boolean
  extendedBio: string | null
  whatsappPhone: string | null
  viberPhone: string | null
}

export function DashboardProfileForm({ profile, featured }: { profile: Profile; featured: boolean }) {
  const [state, action, pending] = useActionState(updateProfile, initialProfileActionState)
  const [descriptionLength, setDescriptionLength] = useState(profile.description.length)

  const error = (key: 'name' | 'billingName' | 'email' | 'phone' | 'profession' | 'description') => state.errors?.[key]?.[0]

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.message && (
        <Alert variant={state.status === 'error' ? 'destructive' : 'default'}>
          {state.status === 'success' && <CheckCircle2 />}
          <AlertTitle>{state.status === 'success' ? 'Sikeres mentés' : 'Ellenőrizze az adatokat'}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <FieldGroup className="grid md:grid-cols-2">
        <Field data-invalid={Boolean(error('name'))}>
          <FieldLabel htmlFor="name">Teljes név</FieldLabel>
          <Input id="name" name="name" defaultValue={profile.name} minLength={2} maxLength={120} required aria-invalid={Boolean(error('name'))} />
          <FieldError>{error('name')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(error('billingName'))}>
          <FieldLabel htmlFor="billingName">Vállalkozás neve</FieldLabel>
          <Input id="billingName" name="billingName" defaultValue={profile.billingName} minLength={2} maxLength={160} required aria-invalid={Boolean(error('billingName'))} />
          <FieldError>{error('billingName')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(error('email'))}>
          <FieldLabel htmlFor="email">E-mail-cím</FieldLabel>
          <Input id="email" name="email" type="email" defaultValue={profile.email ?? ''} autoComplete="email" required aria-invalid={Boolean(error('email'))} />
          <FieldError>{error('email')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(error('phone'))}>
          <FieldLabel htmlFor="phone">Telefonszám</FieldLabel>
          <Input id="phone" name="phone" type="tel" defaultValue={profile.phone} autoComplete="tel" minLength={8} required aria-invalid={Boolean(error('phone'))} />
          <FieldError>{error('phone')}</FieldError>
        </Field>
        <Field className="md:col-span-2" data-invalid={Boolean(error('profession'))}>
          <FieldLabel htmlFor="profession">Szakma</FieldLabel>
          <select id="profession" name="profession" defaultValue={profile.profession} className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base" required aria-invalid={Boolean(error('profession'))}>
            {CATEGORIES.map((category) => <option key={category.key} value={category.name}>{category.name}</option>)}
          </select>
          <FieldError>{error('profession')}</FieldError>
        </Field>
        <Field className="md:col-span-2" data-invalid={Boolean(error('description'))}>
          <FieldLabel htmlFor="description">Bemutatkozás</FieldLabel>
          <Textarea id="description" name="description" defaultValue={profile.description} minLength={20} maxLength={1000} required aria-invalid={Boolean(error('description'))} onChange={(event) => setDescriptionLength(event.target.value.length)} className="min-h-32" />
          <div className="flex items-center justify-between gap-4">
            <FieldDescription>Írja le röviden, miben tud segíteni az ügyfeleknek.</FieldDescription>
            <span className="text-sm text-muted-foreground" aria-live="polite">{descriptionLength}/1000</span>
          </div>
          <FieldError>{error('description')}</FieldError>
        </Field>
        <Field orientation="horizontal" className="rounded-xl border border-border bg-secondary p-4 md:col-span-2">
          <input id="isEmergency247" type="checkbox" name="isEmergency247" defaultChecked={profile.isEmergency247} className="size-5 shrink-0 accent-primary" />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="isEmergency247">0–24 ügyeletet vállalok</FieldLabel>
            <FieldDescription>Az adatlap az SOS Gyorsszolgálat listájában is megjelenhet.</FieldDescription>
          </div>
        </Field>
        {featured && (
          <>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="extendedBio">Részletes bemutatkozás</FieldLabel>
              <Textarea id="extendedBio" name="extendedBio" defaultValue={profile.extendedBio ?? ''} maxLength={3000} className="min-h-40" />
            </Field>
            <Field><FieldLabel htmlFor="whatsappPhone">WhatsApp szám</FieldLabel><Input id="whatsappPhone" name="whatsappPhone" defaultValue={profile.whatsappPhone ?? ''} /></Field>
            <Field><FieldLabel htmlFor="viberPhone">Viber szám</FieldLabel><Input id="viberPhone" name="viberPhone" defaultValue={profile.viberPhone ?? ''} /></Field>
          </>
        )}
      </FieldGroup>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary p-4 text-sm leading-relaxed">
        <input name="accepted" type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" required />
        <span>Elfogadom a jelenlegi <Link href="/aszf" className="font-bold text-primary underline underline-offset-4">ÁSZF-et</Link> és az adatkezelési feltételeket. A mentés jogi audit eseményt rögzít.</span>
      </label>
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}
        {pending ? 'Mentés…' : 'Profil mentése'}
      </Button>
    </form>
  )
}
