'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'

type Availability = { profession: string; city: string; county?: string | null; zipCode: string | null }
type Defaults = { q?: string; category?: string; county?: string; city?: string; zipCode?: string }
type ValidAvailability = { profession: string; city: string; county: string; zipCode: string }

const collator = new Intl.Collator('hu')
const uniqueSorted = (values: string[]) => [...new Set(values)].sort(collator.compare)

export function DynamicSearchForm({ availability, defaults = {}, compact = false, collapseAfterSearch = false, hiddenFields }: {
  availability: Availability[]
  defaults?: Defaults
  compact?: boolean
  collapseAfterSearch?: boolean
  hiddenFields?: Record<string, string>
}) {
  const rows = useMemo<ValidAvailability[]>(() => availability
    .filter((item): item is Availability & { county: string } => Boolean(item.profession.trim() && item.county?.trim() && item.city.trim()))
    .map((item) => ({ profession: item.profession.trim(), county: item.county.trim(), city: item.city.trim(), zipCode: item.zipCode?.trim() ?? '' })), [availability])

  const initial = useMemo(() => {
    const selectedSzakma = defaults.category && rows.some((row) => row.profession === defaults.category) ? defaults.category : ''
    const selectedMegye = defaults.county && selectedSzakma && rows.some((row) => row.profession === selectedSzakma && row.county === defaults.county) ? defaults.county : ''
    const settlement = defaults.city && selectedMegye
      ? rows.find((row) => row.profession === selectedSzakma && row.county === selectedMegye && row.city === defaults.city)
      : undefined
    return { selectedSzakma, selectedMegye, selectedTelepules: settlement?.city ?? '', zipCode: settlement?.zipCode ?? '' }
  }, [defaults.category, defaults.county, defaults.city, rows])

  const [expanded, setExpanded] = useState(!collapseAfterSearch)
  const [selectedSzakma, setSelectedSzakma] = useState(initial.selectedSzakma)
  const [selectedMegye, setSelectedMegye] = useState(initial.selectedMegye)
  const [selectedTelepules, setSelectedTelepules] = useState(initial.selectedTelepules)
  const [zipCode, setZipCode] = useState(initial.zipCode)

  const professionNames = useMemo(() => uniqueSorted(rows.map((row) => row.profession)), [rows])
  const professionOptions = CATEGORIES.filter((item) => professionNames.includes(item.name))
  const countyOptions = useMemo(() => selectedSzakma
    ? uniqueSorted(rows.filter((row) => row.profession === selectedSzakma).map((row) => row.county))
    : [], [rows, selectedSzakma])
  const settlementOptions = useMemo(() => {
    if (!selectedSzakma || !selectedMegye) return []
    const available = new Map<string, string>()
    rows.filter((row) => row.profession === selectedSzakma && row.county === selectedMegye).forEach((row) => {
      if (!available.has(row.city)) available.set(row.city, row.zipCode)
    })
    return [...available].map(([city, postalCode]) => ({ city, zipCode: postalCode })).sort((a, b) => collator.compare(a.city, b.city))
  }, [rows, selectedSzakma, selectedMegye])

  function selectSzakma(value: string) {
    setSelectedSzakma(value)
    setSelectedMegye('')
    setSelectedTelepules('')
    setZipCode('')
  }

  function selectMegye(value: string) {
    setSelectedMegye(value)
    setSelectedTelepules('')
    setZipCode('')
  }

  function selectTelepules(value: string) {
    setSelectedTelepules(value)
    setZipCode(settlementOptions.find((item) => item.city === value)?.zipCode ?? '')
  }

  const fieldClass = compact
    ? 'min-h-16 w-full rounded-2xl border border-border bg-card px-4 text-lg font-bold text-foreground shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring md:min-h-14 md:rounded-xl md:border-2 md:bg-background'
    : 'field-input min-h-14'
  const labelClass = compact ? 'text-lg font-black text-primary' : 'field-label'

  const filters = <div className={`grid gap-5 ${compact ? 'md:grid-cols-2' : 'md:col-span-2 md:grid-cols-3'}`}>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Szakma</span>
      <select name="kategoria" className={fieldClass} value={selectedSzakma} onChange={(event) => selectSzakma(event.target.value)} required={compact}>
        <option value="" disabled={compact}>{compact ? 'Válasszon szakmát' : 'Minden szakma'}</option>
        {professionOptions.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}
      </select>
    </label>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Megye</span>
      <select name="megye" className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`} value={selectedMegye} onChange={(event) => selectMegye(event.target.value)} disabled={!selectedSzakma} required={compact}>
        <option value="" disabled={compact}>{selectedSzakma ? (compact ? 'Válasszon megyét' : 'Minden megye') : 'Előbb válasszon szakmát'}</option>
        {countyOptions.map((county) => <option key={county} value={county}>{county}</option>)}
      </select>
    </label>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Település</span>
      <select name="telepules" className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`} value={selectedTelepules} onChange={(event) => selectTelepules(event.target.value)} disabled={!selectedMegye} required={compact}>
        <option value="" disabled={compact}>{selectedMegye ? (compact ? 'Válasszon települést' : 'Minden település') : 'Előbb válasszon megyét'}</option>
        {settlementOptions.map((item) => <option key={`${item.city}-${item.zipCode}`} value={item.city}>{item.zipCode ? `${item.city} (${item.zipCode})` : item.city}</option>)}
      </select>
    </label>
    <input type="hidden" name="iranyitoszam" value={zipCode} />
  </div>

  if (compact) return <form action="/kereses" className="app-card-mobile mt-5 flex w-full flex-col gap-5 bg-background p-5 text-foreground md:mt-8 md:p-6 md:shadow-lg" aria-label="Szakember keresése">
    {filters}
    <button className="btn-primary min-h-14 w-full" type="submit"><Search aria-hidden="true" />Keresés</button>
  </form>

  return <div className="mt-5">
    {collapseAfterSearch && <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="detailed-search-filters" className="btn-outline w-full justify-between"><span className="flex items-center gap-2"><SlidersHorizontal aria-hidden="true" />Szűrők módosítása</span><ChevronDown className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button>}
    <div id="detailed-search-filters" className={`grid transition-[grid-template-rows,opacity] duration-300 ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden"><form className="surface mt-4 flex flex-col gap-5" action="/kereses">
        {Object.entries(hiddenFields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        <label className="flex flex-col gap-2"><span className="field-label">Név vagy kulcsszó</span><input name="q" defaultValue={defaults.q} className="field-input min-h-14" placeholder="például csapcsere" /></label>
        {filters}
        <button className="btn-primary min-h-14 self-stretch md:self-end" type="submit"><Search aria-hidden="true" />Keresés</button>
      </form></div>
    </div>
  </div>
}
