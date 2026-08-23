'use client'

import { useId, useMemo, useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { HUNGARIAN_COUNTIES, locationByCountyAndCity, locationsForCounty } from '@/lib/hungary-locations'

export type SettlementOption = { city: string; zipCode: string }

type Props = {
  countyName: string
  cityName: string
  zipName: string
  defaultCounty?: string
  defaultCity?: string
  defaultZipCode?: string
  required?: boolean
  compact?: boolean
  countyError?: string
  cityError?: string
  zipError?: string
  countyOptions?: string[]
  settlementOptions?: SettlementOption[]
  countyValue?: string
  cityValue?: string
  zipValue?: string
  countyDisabled?: boolean
  onCountyChange?: (county: string) => void
  onCityChange?: (city: string, zipCode: string, form: HTMLFormElement | null) => void
  onComplete?: (form: HTMLFormElement | null) => void
}

export function HierarchicalLocationSelector({ countyName, cityName, zipName, defaultCounty = '', defaultCity = '', defaultZipCode = '', required = false, compact = false, countyError, cityError, zipError, countyOptions, settlementOptions, countyValue, cityValue, zipValue, countyDisabled = false, onCountyChange, onCityChange, onComplete }: Props) {
  const id = useId().replace(/:/g, '')
  const validDefault = locationByCountyAndCity(defaultCounty, defaultCity)
  const [internalCounty, setInternalCounty] = useState(validDefault?.county ?? (HUNGARIAN_COUNTIES.includes(defaultCounty) ? defaultCounty : ''))
  const [internalCity, setInternalCity] = useState(validDefault?.city ?? '')
  const [internalZipCode, setInternalZipCode] = useState(validDefault?.zipCode ?? defaultZipCode)
  const county = countyValue ?? internalCounty
  const city = cityValue ?? internalCity
  const zipCode = zipValue ?? internalZipCode
  const counties = countyOptions ?? HUNGARIAN_COUNTIES
  const settlements = useMemo(() => settlementOptions ?? locationsForCounty(county), [county, settlementOptions])
  const inputClass = compact ? 'min-h-16 w-full rounded-2xl border border-border bg-card px-4 text-lg font-bold text-foreground shadow-sm md:rounded-xl md:border-2 md:bg-background' : 'field-input min-h-14'

  function changeCounty(value: string) {
    if (countyValue === undefined) {
      setInternalCounty(value)
      setInternalCity('')
      setInternalZipCode('')
    }
    onCountyChange?.(value)
  }

  function changeCity(value: string, form: HTMLFormElement | null) {
    const exact = settlements.find((item) => item.city === value)
    const nextZipCode = exact?.zipCode ?? ''
    if (cityValue === undefined) {
      setInternalCity(value)
      setInternalZipCode(nextZipCode)
    }
    onCityChange?.(value, nextZipCode, form)
    if (exact) onComplete?.(form)
  }

  return <div className={`grid gap-5 ${compact ? 'md:grid-cols-2' : 'md:col-span-2 md:grid-cols-2'}`}>
    <label className="flex flex-col gap-2">
      <span className={compact ? 'text-lg font-black text-primary' : 'field-label'}>Megye</span>
      <select id={`${id}-county`} name={countyName} value={county} onChange={(event) => changeCounty(event.target.value)} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60 ${countyError ? 'border-destructive ring-2 ring-destructive/20' : ''}`} disabled={countyDisabled} required={required} aria-invalid={Boolean(countyError)} aria-describedby={countyError ? `${id}-county-error` : undefined}>
        <option value="" disabled={required}>{countyDisabled ? 'Előbb válasszon szakmát' : required ? 'Válasszon megyét' : 'Minden megye'}</option>
        {counties.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      {countyError && <span id={`${id}-county-error`} role="alert" className="text-sm font-bold text-destructive">{countyError}</span>}
    </label>

    <label className="flex flex-col gap-2">
      <span className={compact ? 'text-lg font-black text-primary' : 'field-label'}>Település</span>
      <select id={`${id}-city`} name={cityName} value={city} onChange={(event) => changeCity(event.target.value, event.currentTarget.form)} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60 ${cityError ? 'border-destructive ring-2 ring-destructive/20' : ''}`} disabled={!county} required={required} aria-invalid={Boolean(cityError)} aria-describedby={cityError ? `${id}-city-error` : undefined}>
        <option value="" disabled={required}>{county ? (required ? 'Válasszon települést' : 'Minden település') : 'Előbb válasszon megyét'}</option>
        {settlements.map((item) => <option key={`${item.city}-${item.zipCode}`} value={item.city}>{item.zipCode ? `${item.city} (${item.zipCode})` : item.city}</option>)}
      </select>
      {cityError && <span id={`${id}-city-error`} role="alert" className="text-sm font-bold text-destructive">{cityError}</span>}
    </label>

    <input type="hidden" name={zipName} value={zipCode} />
    <div className="flex min-h-10 items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground md:col-span-2" role="status" aria-live="polite">
      {zipCode ? <><Check className="size-4 text-primary" aria-hidden="true" />Irányítószám automatikusan beállítva: <strong className="text-foreground">{zipCode}</strong></> : <><MapPin className="size-4" aria-hidden="true" />Az irányítószámot a település kiválasztásakor automatikusan kitöltjük.</>}
      {zipError && <span role="alert" className="text-destructive"> {zipError}</span>}
    </div>
  </div>
}
