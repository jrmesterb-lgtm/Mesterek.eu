'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { HUNGARIAN_COUNTIES, locationsForCounty } from '@/lib/hungary-locations'
import { cn } from '@/lib/utils'
import { ResponsiveSelect, type Option } from '@/components/responsive-select'

const collator = new Intl.Collator('hu')

type Props = {
  professionError?: string
  countyError?: string
  cityError?: string
  zipError?: string
  initialProfession?: string
  initialCounty?: string
  initialCity?: string
  initialZipCode?: string
}

/**
 * Registration Szakma / Megye / Település selectors.
 *
 * Reuses the SAME ResponsiveSelect (centered mobile modal) + auto-stepping flow
 * as the main search hero: selecting Szakma opens Megye, selecting Megye opens
 * Település, selecting Település closes cleanly (no navigation here — this is a
 * form field, so it just fills the hidden inputs the server action reads).
 */
export function RegistrationLocationFields({ professionError, countyError, cityError, zipError, initialProfession = '', initialCounty = '', initialCity = '', initialZipCode = '' }: Props) {
  const [profession, setProfession] = useState(initialProfession)
  const [county, setCounty] = useState(initialCounty)
  const [city, setCity] = useState(initialCity)
  const [zipCode, setZipCode] = useState(initialZipCode)

  // Re-seed from the values the server action echoes back after a failed submit
  // so the Szakma/Megye/Település selections survive the round-trip. Only adopt
  // an incoming value when it is non-empty and actually differs, so live user
  // edits are never clobbered by a stale prop.
  useEffect(() => { if (initialProfession && initialProfession !== profession) setProfession(initialProfession) }, [initialProfession])
  useEffect(() => { if (initialCounty && initialCounty !== county) setCounty(initialCounty) }, [initialCounty])
  useEffect(() => { if (initialCity && initialCity !== city) setCity(initialCity) }, [initialCity])
  useEffect(() => { if (initialZipCode && initialZipCode !== zipCode) setZipCode(initialZipCode) }, [initialZipCode])

  const [professionOpen, setProfessionOpen] = useState(false)
  const [countyOpen, setCountyOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)

  // Defer opening the next modal by a tick so the just-selected one finishes
  // closing first — this mirrors the search form and avoids focus/scroll races.
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (openTimer.current) clearTimeout(openTimer.current) }, [])
  function openNext(setOpen: (value: boolean) => void) {
    if (openTimer.current) clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 120)
  }

  const professionOptions: Option[] = useMemo(() => CATEGORIES.map((item) => ({ value: item.name, label: item.name })), [])
  const countyOptions: Option[] = useMemo(() => HUNGARIAN_COUNTIES.map((item) => ({ value: item, label: item })), [])
  const settlements = useMemo(() => (county ? locationsForCounty(county) : []), [county])
  const settlementOptions: Option[] = useMemo(() => [...settlements]
    .sort((a, b) => collator.compare(a.city, b.city))
    .map((item) => ({ value: item.city, label: item.zipCode ? `${item.city} (${item.zipCode})` : item.city })), [settlements])

  // Step 1: Szakma → reset downstream, open Megye.
  // NOTE: closing the just-used modal is handled by ResponsiveSelect itself on
  // the next tick (deferred onOpenChange). We deliberately do NOT call
  // setProfessionOpen(false) here — closing in the same synchronous click as the
  // value commit batches both updates together and can wedge the mobile modal
  // open (checkmark shows, but it never closes). On desktop, Radix still fires
  // its own onOpenChange so the field closes there regardless.
  function selectProfession(value: string) {
    setProfession(value)
    setCounty('')
    setCity('')
    setZipCode('')
    if (value) openNext(setCountyOpen)
  }

  // Step 2: Megye → reset downstream, open Település. Close is deferred by
  // ResponsiveSelect (see selectProfession note).
  function selectCounty(value: string) {
    setCounty(value)
    setCity('')
    setZipCode('')
    if (value) openNext(setCityOpen)
  }

  // Step 3: Település → set zip. Close is deferred by ResponsiveSelect (see
  // selectProfession note), so the user is never trapped after picking a city.
  function selectCity(value: string) {
    const nextZip = settlements.find((item) => item.city === value)?.zipCode ?? ''
    setCity(value)
    setZipCode(nextZip)
  }

  const triggerClass = cn('field-input min-h-14', 'h-auto w-full justify-between text-left font-bold')

  return <>
    <label className="flex flex-col gap-2">
      <span className="field-label">Szakma</span>
      <ResponsiveSelect name="profession" required value={profession} onValueChange={selectProfession} open={professionOpen} onOpenChange={setProfessionOpen} options={professionOptions} placeholder="Válasszon szakmát" title="Válasszon szakmát" triggerClassName={cn(triggerClass, professionError && 'border-destructive ring-2 ring-destructive/20')} ariaLabel="Szakma" />
      {professionError && <span role="alert" className="text-sm font-bold leading-relaxed text-destructive">{professionError}</span>}
    </label>

    <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="field-label">Megye</span>
        <ResponsiveSelect name="county" required disabled={!profession} value={county} onValueChange={selectCounty} open={countyOpen} onOpenChange={setCountyOpen} options={countyOptions} placeholder={profession ? 'Válasszon megyét' : 'Előbb válasszon szakmát'} title="Válasszon megyét" triggerClassName={cn(triggerClass, countyError && 'border-destructive ring-2 ring-destructive/20')} ariaLabel="Megye" />
        {countyError && <span role="alert" className="text-sm font-bold leading-relaxed text-destructive">{countyError}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="field-label">Település</span>
        <ResponsiveSelect name="city" required disabled={!county} value={city} onValueChange={selectCity} open={cityOpen} onOpenChange={setCityOpen} options={settlementOptions} placeholder={county ? 'Válasszon települést' : 'Előbb válasszon megyét'} title="Válasszon települést" triggerClassName={cn(triggerClass, cityError && 'border-destructive ring-2 ring-destructive/20')} ariaLabel="Település" />
        {cityError && <span role="alert" className="text-sm font-bold leading-relaxed text-destructive">{cityError}</span>}
      </label>

      <input type="hidden" name="zipCode" value={zipCode} />
      <div className="flex min-h-10 items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground md:col-span-2" role="status" aria-live="polite">
        {zipCode ? <><Check className="size-4 text-primary" aria-hidden="true" />Irányítószám automatikusan beállítva: <strong className="text-foreground">{zipCode}</strong></> : 'Az irányítószámot a település kiválasztásakor automatikusan kitöltjük.'}
        {zipError && <span role="alert" className="text-destructive"> {zipError}</span>}
      </div>
    </div>
  </>
}
