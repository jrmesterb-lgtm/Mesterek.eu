'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export const ADMIN_PAGE_SIZE = 15

export function AdminPagination({ page, totalItems, pageSize = ADMIN_PAGE_SIZE, onPageChange }: { page: number; totalItems: number; pageSize?: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems <= pageSize) return null

  return (
    <nav className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Lapozás">
      <p className="text-center text-sm font-bold text-muted-foreground sm:text-left">{page}. / {totalPages} oldal · {totalItems} elem</p>
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 font-black text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" />Előző</button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 font-black text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">Következő<ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>
    </nav>
  )
}
