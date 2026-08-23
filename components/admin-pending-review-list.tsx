'use client'

import { useState, useTransition } from 'react'
import { Check, Clock3, Mail, MapPin, Phone, UserRound, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Professional } from '@/lib/db/schema'
import { setProfessionalStatus } from '@/app/admin/actions'

export function AdminPendingReviewList({ records }: { records: Professional[] }) {
  if (records.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-center"><Check className="mx-auto size-10 text-primary" aria-hidden="true" /><h3 className="mt-4 text-xl font-black text-foreground">Nincs ellenőrzésre váró regisztráció</h3><p className="mt-2 text-muted-foreground">Az új szakemberek automatikusan megjelennek itt jóváhagyás előtt.</p></div>
  }

  return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="hidden grid-cols-[minmax(11rem,1.2fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.2fr)_10rem] gap-4 border-b border-border bg-muted px-5 py-3 text-sm font-black text-muted-foreground lg:grid">
      <span>Szakember</span><span>Szakma</span><span>Helyszín</span><span>Kapcsolat</span><span className="text-right">Műveletek</span>
    </div>
    <div className="divide-y divide-border">{records.map((record) => <PendingReviewRow key={record.id} record={record} />)}</div>
  </div>
}

function PendingReviewRow({ record }: { record: Professional }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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

  const submittedAt = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.createdAt))
  return <article className="grid gap-5 p-5 lg:grid-cols-[minmax(11rem,1.2fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.2fr)_10rem] lg:items-center">
    <div><p className="flex items-center gap-2 font-black text-foreground"><UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />{record.name}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4 shrink-0" aria-hidden="true" /><span><span className="lg:hidden">Beküldve: </span>{submittedAt}</span></p></div>
    <div><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Szakma</p><p className="mt-1 font-bold text-foreground lg:mt-0">{record.profession}</p></div>
    <div><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Helyszín</p><p className="mt-1 flex items-start gap-2 font-bold text-foreground lg:mt-0"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{[record.county, record.city].filter(Boolean).join(', ') || 'Nincs megadva'}</p></div>
    <div className="flex flex-col gap-2"><p className="text-xs font-black uppercase tracking-wider text-muted-foreground lg:hidden">Kapcsolat</p><a href={`tel:${record.phone}`} className="flex items-center gap-2 break-all font-bold text-foreground hover:text-primary"><Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />{record.phone}</a>{record.email ? <a href={`mailto:${record.email}`} className="flex items-center gap-2 break-all text-sm text-muted-foreground hover:text-primary"><Mail className="size-4 shrink-0" aria-hidden="true" />{record.email}</a> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4 shrink-0" aria-hidden="true" />Nincs megadva</p>}</div>
    <div className="flex flex-col gap-2 lg:items-stretch"><button type="button" disabled={isPending} onClick={() => updateStatus('APPROVED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-black text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"><Check className="size-4" aria-hidden="true" />{isPending ? 'Mentés…' : 'Jóváhagyás'}</button><button type="button" disabled={isPending} onClick={() => updateStatus('REJECTED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-2 font-black text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-wait disabled:opacity-60"><X className="size-4" aria-hidden="true" />Elutasítás</button>{error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}</div>
  </article>
}
