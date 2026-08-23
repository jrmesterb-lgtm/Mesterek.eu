'use client'

import { useEffect, useState, useTransition } from 'react'
import { CheckSquare2, Loader2, MailX, Trash2 } from 'lucide-react'
import { clearImportPlaceholderEmails, deleteSelectedProfessionals } from '@/app/admin/actions'
import type { Professional } from '@/lib/db/schema'
import { AdminProfessionalCard } from './admin-professional-card'
import { ADMIN_PAGE_SIZE, AdminPagination } from './admin-pagination'

export function AdminProfessionalList({ records }: { records: Professional[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const totalPages = Math.max(1, Math.ceil(records.length / ADMIN_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRecords = records.slice((safePage - 1) * ADMIN_PAGE_SIZE, safePage * ADMIN_PAGE_SIZE)
  const allVisibleSelected = visibleRecords.length > 0 && visibleRecords.every((record) => selected.has(record.id))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function toggleVisible() {
    setSelected((current) => {
      const next = new Set(current)
      for (const record of visibleRecords) {
        if (allVisibleSelected) next.delete(record.id)
        else next.add(record.id)
      }
      return next
    })
  }

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function removeSelected() {
    if (!selected.size || !window.confirm(`Biztosan végleg törli a kijelölt ${selected.size} szakembert?`)) return
    startTransition(async () => {
      const result = await deleteSelectedProfessionals([...selected])
      setSelected(new Set())
      setMessage(`${result.deleted} kijelölt adatlap törölve.`)
    })
  }

  function removePlaceholders() {
    if (!window.confirm('Biztosan törli az összes érvénytelen és importált e-mail-címet? A szakember-adatlapok és minden más adat változatlanul megmarad.')) return
    startTransition(async () => {
      const result = await clearImportPlaceholderEmails()
      setMessage(result.cleared ? `${result.cleared} érvénytelen vagy importált e-mail-cím törölve. A szakember-adatlapok változatlanul megmaradtak.` : 'Nem található érvénytelen vagy importált e-mail-cím.')
    })
  }

  return <div className="flex flex-col gap-5">
    <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-lg md:flex-row md:items-center md:justify-between">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 font-black text-foreground">
        <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="size-5 accent-primary" />
        <CheckSquare2 className="size-5 text-primary" aria-hidden="true" />Oldal kijelölése
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={removeSelected} disabled={!selected.size || isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-3 font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}Kijelöltek törlése{selected.size ? ` (${selected.size})` : ''}</button>
        <button type="button" onClick={removePlaceholders} disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-destructive px-5 py-3 text-center font-black text-destructive hover:bg-destructive hover:text-primary-foreground disabled:opacity-50"><MailX aria-hidden="true" />Érvénytelen és importált e-mail-címek törlése</button>
      </div>
    </div>
    {message && <p role="status" className="rounded-xl bg-secondary p-4 font-bold text-primary">{message}</p>}
    {visibleRecords.map((item) => <AdminProfessionalCard key={item.id} item={item} selected={selected.has(item.id)} onSelectedChange={() => toggle(item.id)} />)}
    <div className="overflow-hidden rounded-2xl border border-border bg-card"><AdminPagination page={safePage} totalItems={records.length} onPageChange={setPage} /></div>
  </div>
}
