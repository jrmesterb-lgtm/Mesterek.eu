'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Check, Clock3, LoaderCircle, Mail, MapPin, Pencil, Phone, Save, UserRound, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Professional } from '@/lib/db/schema'
import { setProfessionalStatus, updatePendingProfessional, type PendingProfessionalUpdateResult } from '@/app/admin/actions'
import { CATEGORIES } from '@/lib/constants'
import { HUNGARIAN_COUNTIES, locationsForCounty } from '@/lib/hungary-locations'
import { ADMIN_PAGE_SIZE, AdminPagination } from '@/components/admin-pagination'

export function AdminPendingReviewList({ records }: { records: Professional[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(records.length / ADMIN_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRecords = records.slice((safePage - 1) * ADMIN_PAGE_SIZE, safePage * ADMIN_PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (records.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-center"><Check className="mx-auto size-10 text-primary" aria-hidden="true" /><h3 className="mt-4 text-xl font-black text-foreground">Nincs ellenőrzésre váró regisztráció</h3><p className="mt-2 text-muted-foreground">Az új szakemberek automatikusan megjelennek itt jóváhagyás előtt.</p></div>
  }

  return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="hidden grid-cols-[minmax(11rem,1.2fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.2fr)_11rem] gap-4 border-b border-border bg-muted px-5 py-3 text-sm font-black text-muted-foreground lg:grid">
      <span>Szakember</span><span>Szakma</span><span>Helyszín</span><span>Kapcsolat</span><span className="text-right">Műveletek</span>
    </div>
    <div className="divide-y divide-border">{visibleRecords.map((record) => <PendingReviewRow key={record.id} record={record} />)}</div>
    <AdminPagination page={safePage} totalItems={records.length} onPageChange={setPage} />
  </div>
}

function PendingReviewRow({ record }: { record: Professional }) {
  const router = useRouter()
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')

  function updateStatus(status: 'APPROVED' | 'REJECTED') {
    setError('')
    const formData = new FormData()
    formData.set('id', String(record.id))
    formData.set('status', status)
    startTransition(async () => {
      const result = await setProfessionalStatus(formData)
      if (!result.success) return setError(result.error)
      router.refresh()
    })
  }

  const closeEditor = useCallback(() => {
    setIsEditing(false)
    requestAnimationFrame(() => editButtonRef.current?.focus())
  }, [])

  const submittedAt = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.createdAt))
  return <>
    <article className="grid gap-5 p-5 lg:grid-cols-[minmax(11rem,1.2fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.2fr)_11rem] lg:items-center">
      <div><p className="flex items-center gap-2 font-black text-foreground"><UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />{record.name}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4 shrink-0" aria-hidden="true" /><span><span className="lg:hidden">Beküldve: </span>{submittedAt}</span></p></div>
      <div><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Szakma</p><p className="mt-1 font-bold text-foreground lg:mt-0">{record.profession}</p></div>
      <div><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Helyszín</p><p className="mt-1 flex items-start gap-2 font-bold text-foreground lg:mt-0"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{[record.county, record.city].filter(Boolean).join(', ') || 'Nincs megadva'}</p></div>
      <div className="flex flex-col gap-2"><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Kapcsolat</p><a href={`tel:${record.phone}`} className="flex items-center gap-2 break-all font-bold text-foreground hover:text-primary"><Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />{record.phone}</a>{record.email ? <a href={`mailto:${record.email}`} className="flex items-center gap-2 break-all text-sm text-muted-foreground hover:text-primary"><Mail className="size-4 shrink-0" aria-hidden="true" />{record.email}</a> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4 shrink-0" aria-hidden="true" />Nincs megadva</p>}</div>
      <div className="flex flex-col gap-2 lg:items-stretch">
        <button ref={editButtonRef} type="button" disabled={isPending} onClick={() => setIsEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-black text-foreground transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"><Pencil className="size-4" aria-hidden="true" />Szerkesztés</button>
        <button type="button" disabled={isPending} onClick={() => updateStatus('APPROVED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-black text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"><Check className="size-4" aria-hidden="true" />{isPending ? 'Mentés…' : 'Jóváhagyás'}</button>
        <button type="button" disabled={isPending} onClick={() => updateStatus('REJECTED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-2 font-black text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-wait disabled:opacity-60"><X className="size-4" aria-hidden="true" />Elutasítás</button>
        {error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}
      </div>
    </article>
    {isEditing && <PendingRegistrationEditor record={record} onClose={closeEditor} onSaved={() => { closeEditor(); router.refresh() }} />}
  </>
}

type EditableField = 'name' | 'profession' | 'county' | 'city' | 'phone' | 'email'
type EditValues = Record<EditableField, string>

function PendingRegistrationEditor({ record, onClose, onSaved }: { record: Professional; onClose: () => void; onSaved: () => void }) {
  const titleId = `pending-edit-title-${record.id}`
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const initialCounty = HUNGARIAN_COUNTIES.includes(record.county ?? '') ? record.county ?? '' : ''
  const initialCity = initialCounty && locationsForCounty(initialCounty).some((location) => location.city === record.city) ? record.city : ''
  const [values, setValues] = useState<EditValues>({ name: record.name, profession: record.profession, county: initialCounty, city: initialCity, phone: record.phone, email: record.email ?? '' })
  const [result, setResult] = useState<PendingProfessionalUpdateResult>({ success: false })
  const cityOptions = values.county ? locationsForCounty(values.county) : []

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstInputRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isPending, onClose])

  function setField(field: EditableField, value: string) {
    setValues((current) => ({ ...current, [field]: value, ...(field === 'county' ? { city: '' } : {}) }))
    setResult((current) => ({ ...current, error: undefined, fieldErrors: { ...current.fieldErrors, [field]: undefined, ...(field === 'county' ? { city: undefined } : {}) } }))
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData()
    formData.set('id', String(record.id))
    for (const [key, value] of Object.entries(values)) formData.set(key, key === 'phone' ? value.replace(/[\s()-]/g, '') : value)
    startTransition(async () => {
      const nextResult = await updatePendingProfessional(formData)
      setResult(nextResult)
      if (nextResult.success) onSaved()
    })
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[min(90vh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div><p className="text-sm font-black uppercase tracking-wider text-primary">Függőben lévő regisztráció</p><h2 id={titleId} className="mt-1 text-2xl font-black text-balance">Adatok szerkesztése</h2></div>
        <button type="button" onClick={onClose} disabled={isPending} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50" aria-label="Szerkesztő bezárása"><X className="size-5" aria-hidden="true" /></button>
      </div>
      <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
          <EditField label="Szakember / Cég neve" name="name" value={values.name} error={result.fieldErrors?.name} onChange={(value) => setField('name', value)} inputRef={firstInputRef} />
          <EditSelect label="Szakma" name="profession" value={values.profession} error={result.fieldErrors?.profession} onChange={(value) => setField('profession', value)} options={CATEGORIES.map((category) => ({ value: category.name, label: category.name }))} />
          <EditSelect label="Megye" name="county" value={values.county} error={result.fieldErrors?.county} onChange={(value) => setField('county', value)} options={HUNGARIAN_COUNTIES.map((county) => ({ value: county, label: county }))} placeholder="Válasszon megyét" />
          <EditSelect label="Település" name="city" value={values.city} error={result.fieldErrors?.city} onChange={(value) => setField('city', value)} options={cityOptions.map((location) => ({ value: location.city, label: `${location.city} (${location.zipCode})` }))} placeholder={values.county ? 'Válasszon települést' : 'Előbb válasszon megyét'} disabled={!values.county} />
          <EditField label="Telefonszám" name="phone" type="tel" value={values.phone} error={result.fieldErrors?.phone} onChange={(value) => setField('phone', value)} autoComplete="tel" />
          <EditField label="E-mail cím" name="email" type="email" value={values.email} error={result.fieldErrors?.email} onChange={(value) => setField('email', value)} autoComplete="email" required={false} />
          {result.error && <p className="sm:col-span-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold text-destructive" role="alert">{result.error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 font-black text-foreground transition hover:border-primary disabled:opacity-50">Mégse</button>
          <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}{isPending ? 'Mentés…' : 'Mentés'}</button>
        </div>
      </form>
    </div>
  </div>
}

function EditField({ label, name, value, error, onChange, inputRef, type = 'text', autoComplete, required = true }: { label: string; name: string; value: string; error?: string; onChange: (value: string) => void; inputRef?: React.RefObject<HTMLInputElement | null>; type?: string; autoComplete?: string; required?: boolean }) {
  const errorId = `${name}-edit-error`
  return <label className="flex flex-col gap-2"><span className="text-sm font-black text-foreground">{label}</span><input ref={inputRef} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={`field-input ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`} />{error && <span id={errorId} className="text-sm font-bold text-destructive" role="alert">{error}</span>}</label>
}

function EditSelect({ label, name, value, error, onChange, options, placeholder = 'Válasszon', disabled = false }: { label: string; name: string; value: string; error?: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string; disabled?: boolean }) {
  const errorId = `${name}-edit-error`
  return <label className="flex flex-col gap-2"><span className="text-sm font-black text-foreground">{label}</span><select name={name} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={`field-input disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error && <span id={errorId} className="text-sm font-bold text-destructive" role="alert">{error}</span>}</label>
}
