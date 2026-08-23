'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import type { Professional } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { ADMIN_PAGE_SIZE, AdminPagination } from '@/components/admin-pagination'

export function AdminCategoryStatistics({ records }: { records: Professional[] }) {
  const [page, setPage] = useState(1)
  const activeCounts = new Map<string, number>()
  for (const record of records) {
    if (record.status !== 'APPROVED') continue
    activeCounts.set(record.profession, (activeCounts.get(record.profession) ?? 0) + 1)
  }

  const categories = CATEGORIES.map((category) => ({ ...category, count: activeCounts.get(category.name) ?? 0 }))
  const totalPages = Math.max(1, Math.ceil(categories.length / ADMIN_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleCategories = categories.slice((safePage - 1) * ADMIN_PAGE_SIZE, safePage * ADMIN_PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-card shadow-[0_1px_0_hsl(var(--border))]">
            <tr><th scope="col" className="px-5 py-3 text-sm font-black text-muted-foreground">Szakma</th><th scope="col" className="px-5 py-3 text-right text-sm font-black text-muted-foreground">Aktív adatlap</th><th scope="col" className="px-5 py-3 text-right text-sm font-black text-muted-foreground"><span className="sr-only">Művelet</span></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleCategories.map((category) => {
              const isEmpty = category.count === 0
              return <tr key={category.key} className={cn(isEmpty && 'bg-destructive/10')}>
                <th scope="row" className={cn('px-5 py-3 font-bold', isEmpty ? 'text-destructive' : 'text-foreground')}>{category.name}</th>
                <td className="px-5 py-3 text-right"><span className={cn('inline-flex min-w-9 justify-center rounded-full px-3 py-1 text-sm font-black', isEmpty ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-primary')}>{category.count}</span></td>
                <td className="px-5 py-3 text-right"><Link href={`/admin/kategoria-ellenorzes?kategoria=${encodeURIComponent(category.name)}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 font-bold text-primary hover:bg-secondary">Áttekintés és szerkesztés <ChevronRight aria-hidden="true" /></Link></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <AdminPagination page={safePage} totalItems={categories.length} onPageChange={setPage} />
    </div>
  )
}
