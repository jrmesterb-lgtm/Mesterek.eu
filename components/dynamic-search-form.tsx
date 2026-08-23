'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, SlidersHorizontal, Zap } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ResponsiveSelect, type Option } from '@/components/responsive-select'

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
  const router = useRouter()

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
  const [keyword, setKeyword] = useState(defaults.q ?? '')
  const [selectedSzakma, setSelectedSzakma] = useState(initial.selectedSzakma)
  const [selectedMegye, setSelectedMegye] = useState(initial.selectedMegye)
  const [selectedTelepules, setSelectedTelepules] = useState(initial.selectedTelepules)
  const [zipCode, setZipCode] = useState(initial.zipCode)

  // Purely React-controlled open states — no DOM manipulation.
  const [szakmaOpen, setSzakmaOpen] = useState(false)
  const [megyeOpen, setMegyeOpen] = useState(false)
  const [telepulesOpen, setTelepulesOpen] = useState(false)

  // Deferring the "open next dropdown" by a tick lets the just-selected dropdown
  // finish closing first, which avoids the focus/scroll races that crashed earlier attempts.
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (openTimer.current) clearTimeout(openTimer.current) }, [])
  function openNext(setOpen: (value: boolean) => void) {
    if (openTimer.current) clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 120)
  }

  const professionNames = useMemo(() => uniqueSorted(rows.map((row) => row.profession)), [rows])
  const professionOptions: Option[] = useMemo(() => CATEGORIES.filter((item) => professionNames.includes(item.name)).map((item) => ({ value: item.name, label: item.name })), [professionNames])
  const countyOptions: Option[] = useMemo(() => selectedSzakma
    ? uniqueSorted(rows.filter((row) => row.profession === selectedSzakma).map((row) => row.county)).map((county) => ({ value: county, label: county }))
    : [], [rows, selectedSzakma])
  const settlementOptions = useMemo(() => {
    if (!selectedSzakma || !selectedMegye) return [] as { city: string; zipCode: string }[]
    const available = new Map<string, string>()
    rows.filter((row) => row.profession === selectedSzakma && row.county === selectedMegye).forEach((row) => {
      if (!available.has(row.city)) available.set(row.city, row.zipCode)
    })
    return [...available].map(([city, postalCode]) => ({ city, zipCode: postalCode })).sort((a, b) => collator.compare(a.city, b.city))
  }, [rows, selectedSzakma, selectedMegye])
  const settlementOptionList: Option[] = useMemo(() => settlementOptions.map((item) => ({ value: item.city, label: item.zipCode ? `${item.city} (${item.zipCode})` : item.city })), [settlementOptions])

  function buildSearchUrl(city: string, zip: string) {
    const params = new URLSearchParams()
    Object.entries(hiddenFields ?? {}).forEach(([name, value]) => params.set(name, value))
    if (keyword.trim()) params.set('q', keyword.trim())
    if (selectedSzakma) params.set('kategoria', selectedSzakma)
    if (selectedMegye) params.set('megye', selectedMegye)
    if (city) params.set('telepules', city)
    if (zip) params.set('iranyitoszam', zip)
    return `/kereses?${params.toString()}`
  }

  // Step 1: Szakma → reset downstream, close this dropdown, open Megye.
  function selectSzakma(value: string) {
    setSelectedSzakma(value)
    setSelectedMegye('')
    setSelectedTelepules('')
    setZipCode('')
    setSzakmaOpen(false)
    if (value) openNext(setMegyeOpen)
  }

  // Step 2: Megye → reset downstream, close this dropdown, open Település.
  function selectMegye(value: string) {
    setSelectedMegye(value)
    setSelectedTelepules('')
    setZipCode('')
    setMegyeOpen(false)
    if (value) openNext(setTelepulesOpen)
  }

  // Step 3: Település → close this dropdown and auto-search.
  function selectTelepules(value: string) {
    const nextZip = settlementOptions.find((item) => item.city === value)?.zipCode ?? ''
    setSelectedTelepules(value)
    setZipCode(nextZip)
    setTelepulesOpen(false)
    if (value) router.push(buildSearchUrl(value, nextZip))
  }

  const fieldClass = compact
    ? 'min-h-16 w-full rounded-2xl border border-border bg-card px-4 text-lg font-bold text-foreground shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring md:min-h-14 md:rounded-xl md:border-2 md:bg-background'
    : 'field-input min-h-14'
  const labelClass = compact ? 'text-lg font-black text-primary' : 'field-label'
  const triggerClass = cn(fieldClass, 'h-auto w-full justify-between text-left font-bold')

  const megyePlaceholder = selectedSzakma ? (compact ? 'Válasszon megyét' : 'Minden megye') : 'Előbb válasszon szakmát'
  const telepulesPlaceholder = selectedMegye ? (compact ? 'Válasszon települést' : 'Minden település') : 'Előbb válasszon megyét'

  const filters = <div className={`grid gap-5 ${compact ? 'md:grid-cols-2' : 'md:col-span-2 md:grid-cols-3'}`}>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Szakma</span>
      <ResponsiveSelect name="kategoria" required={compact} value={selectedSzakma} onValueChange={selectSzakma} open={szakmaOpen} onOpenChange={setSzakmaOpen} options={professionOptions} placeholder={compact ? 'Válasszon szakmát' : 'Minden szakma'} title="Válasszon szakmát" triggerClassName={triggerClass} ariaLabel="Szakma" />
    </label>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Megye</span>
      <ResponsiveSelect name="megye" required={compact} disabled={!selectedSzakma} value={selectedMegye} onValueChange={selectMegye} open={megyeOpen} onOpenChange={setMegyeOpen} options={countyOptions} placeholder={megyePlaceholder} title="Válasszon megyét" triggerClassName={triggerClass} ariaLabel="Megye" />
    </label>
    <label className="flex flex-col gap-2">
      <span className={labelClass}>Település</span>
      <ResponsiveSelect name="telepules" required={compact} disabled={!selectedMegye} value={selectedTelepules} onValueChange={selectTelepules} open={telepulesOpen} onOpenChange={setTelepulesOpen} options={settlementOptionList} placeholder={telepulesPlaceholder} title="Válasszon települést" triggerClassName={triggerClass} ariaLabel="Település" />
    </label>
    <input type="hidden" name="iranyitoszam" value={zipCode} />
    <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 md:col-span-full md:text-sm">
      <Zap className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      A keresés a település kiválasztása után automatikusan elindul.
    </p>
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
        <label className="flex flex-col gap-2"><span className="field-label">Név vagy kulcsszó</span><input name="q" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="field-input min-h-14" placeholder="például csapcsere" /></label>
        {filters}
        <button className="btn-primary min-h-14 self-stretch md:self-end" type="submit"><Search aria-hidden="true" />Keresés</button>
      </form></div>
    </div>
  </div>
}
