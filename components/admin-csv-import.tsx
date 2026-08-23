'use client'

import { useRef, useState } from 'react'
import { parse } from 'csv-parse/browser/esm/sync'
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { importOutscraperBatch, type ImportResult } from '@/app/admin/actions'

const BATCH_SIZE = 100
const MAX_FILE_SIZE = 10 * 1024 * 1024
const REQUIRED_COLUMNS = ['query', 'name', 'phone', 'email', 'site', 'full_address', 'city', 'is_emergency_247'] as const
const COLUMN_ALIASES: Record<(typeof REQUIRED_COLUMNS)[number], readonly string[]> = {
  query: ['query'],
  name: ['name'],
  phone: ['phone'],
  email: ['email'],
  site: ['site', 'website', 'url'],
  full_address: ['full_address', 'address'],
  city: ['city'],
  is_emergency_247: ['is_emergency_247', 'isemergency247', 'emergency_247', 'emergency247', '24/7', '0-24', 'nonstop'],
}
type OutscraperRow = Record<(typeof REQUIRED_COLUMNS)[number], string>

const emptyResult: ImportResult = { inserted: 0, duplicates: 0, rejected: 0, warnings: 0, errors: [], warningMessages: [] }

export function AdminCsvImport() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  async function startImport() {
    if (!file || importing) return
    setImporting(true)
    setError('')
    setResult(null)
    setProgress(0)

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Kizárólag .csv fájl tölthető fel.')
      if (file.size > MAX_FILE_SIZE) throw new Error('A CSV fájl legfeljebb 10 MB lehet.')
      const text = await file.text()
      const rows = parse(text, {
        bom: true,
        columns(headers: string[]) {
          const normalizedHeaders = headers.map((header) => header.trim().toLowerCase())
          const mapped = new Set<string>()
          return normalizedHeaders.map((header) => {
            const column = REQUIRED_COLUMNS.find((required) => COLUMN_ALIASES[required].includes(header))
            if (!column || mapped.has(column)) return false
            mapped.add(column)
            return column
          })
        },
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      }) as Partial<OutscraperRow>[]
      const normalizedRows = rows.map((row) => Object.fromEntries(
        REQUIRED_COLUMNS.map((column) => [column, row[column] ?? '']),
      ) as OutscraperRow)
      if (!normalizedRows.length) throw new Error('A CSV fájl nem tartalmaz importálható adatsort.')
      if (normalizedRows.length > 10_000) throw new Error('Egy import legfeljebb 10 000 adatsort tartalmazhat.')

      const total = { ...emptyResult, errors: [] as string[], warningMessages: [] as string[] }
      for (let start = 0; start < normalizedRows.length; start += BATCH_SIZE) {
        const batch = normalizedRows.slice(start, start + BATCH_SIZE)
        const response = await importOutscraperBatch(batch)
        total.inserted += response.inserted
        total.duplicates += response.duplicates
        total.rejected += response.rejected
        total.warnings += response.warnings
        total.errors.push(...response.errors.map((message) => `${start + Number.parseInt(message, 10) || start + 1}. sor: ${message.replace(/^\d+\. sor:\s*/, '')}`))
        total.warningMessages.push(...response.warningMessages.map((message) => `${start + Number.parseInt(message, 10) || start + 1}. sor: ${message.replace(/^\d+\. sor:\s*/, '')}`))
        setProgress(Math.round((Math.min(start + BATCH_SIZE, normalizedRows.length) / normalizedRows.length) * 100))
      }
      total.errors = total.errors.slice(0, 10)
      total.warningMessages = total.warningMessages.slice(0, 10)
      setResult(total)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Az importálás váratlan hibával leállt.')
    } finally {
      setImporting(false)
    }
  }

  function selectFile(selected: File | null) {
    setError('')
    setResult(null)
    setProgress(0)
    setFile(selected)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7" aria-labelledby="csv-import-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary"><Database aria-hidden="true" />Adatbázis-művelet</p>
          <h2 id="csv-import-title" className="text-balance text-3xl font-black text-foreground">CSV Import Center</h2>
          <p className="leading-relaxed text-muted-foreground">Outscraper-export betöltése a szakember-adatbázisba. A rendszer a felismert query, name, phone, email, city, site / website / url és full_address / address mezőket dolgozza fel. A kategóriának pontosan meg kell egyeznie egy jóváhagyott kategórianévvel vagy egyértelmű álnévvel; az ismeretlen, nem egyértelmű vagy a vállalkozás nevével nyilvánvalóan ütköző besorolásokat a rendszer elutasítja. A települést a city és cím mezőből automatikusan felismeri, a magyar/angol országnevet és irányítószámot figyelmen kívül hagyja. A fel nem ismert településű sorokat menti, és kézi ellenőrzésre megjelöli. Az opcionális is_emergency_247 / emergency_247 / 24/7 oszlopban az 1, true, yes, igen, 24/7, 0-24 és nonstop értékek kapcsolják be az SOS jelölést.</p>
        </div>
        <FileSpreadsheet className="size-12 shrink-0 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-dashed border-input bg-muted p-5">
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-foreground">{file ? file.name : 'Válasszon Outscraper CSV fájlt'}</p>
            <p className="mt-1 text-sm text-muted-foreground">CSV, legfeljebb 10 MB és 10 000 adatsor</p>
          </div>
          <button type="button" className="btn-outline shrink-0" onClick={() => inputRef.current?.click()} disabled={importing}><Upload aria-hidden="true" />Fájl kiválasztása</button>
        </div>
      </div>

      {(importing || progress > 0) && <div className="mt-6" aria-live="polite"><div className="mb-2 flex items-center justify-between text-sm font-bold"><span>{importing ? 'Importálás folyamatban' : 'Importálás befejezve'}</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>}

      {error && <div className="mt-6 flex gap-3 rounded-xl border border-destructive bg-card p-4 text-destructive" role="alert"><AlertCircle className="mt-0.5 shrink-0" aria-hidden="true" /><p className="font-bold">{error}</p></div>}

      {result && <div className="mt-6 rounded-xl border border-border bg-muted p-5" aria-live="polite"><div className="flex items-center gap-3"><CheckCircle2 className="text-primary" aria-hidden="true" /><h3 className="text-xl font-black">Importálási összesítő</h3></div><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Új szakember" value={result.inserted} /><Summary label="Kihagyott duplikáció" value={result.duplicates} /><Summary label="Település figyelmeztetés" value={result.warnings} /><Summary label="Elutasított sor" value={result.rejected} /></dl>{result.warningMessages.length > 0 && <div className="mt-5 rounded-xl border border-accent p-4"><p className="font-black text-foreground">Kézi településjavítás szükséges:</p><ul className="mt-2 list-disc pl-6 text-sm leading-relaxed text-muted-foreground">{result.warningMessages.map((message) => <li key={message}>{message}</li>)}</ul></div>}{result.errors.length > 0 && <div className="mt-5"><p className="font-black">Első javítandó sorok:</p><ul className="mt-2 list-disc pl-6 text-sm leading-relaxed text-muted-foreground">{result.errors.map((message) => <li key={message}>{message}</li>)}</ul></div>}</div>}

      <button type="button" className="btn-primary mt-6 w-full sm:w-auto" onClick={startImport} disabled={!file || importing}>{importing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Database aria-hidden="true" />}{importing ? 'Feldolgozás…' : 'Importálás indítása'}</button>
    </section>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div><dt className="text-sm font-bold text-muted-foreground">{label}</dt><dd className="mt-1 text-3xl font-black text-foreground">{value}</dd></div>
}
