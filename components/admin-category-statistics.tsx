import Link from 'next/link'
import { BarChart3, ChevronRight } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import type { Professional } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function AdminCategoryStatistics({ records }: { records: Professional[] }) {
  const activeCounts = new Map<string, number>()

  for (const record of records) {
    if (record.status !== 'APPROVED') continue
    activeCounts.set(record.profession, (activeCounts.get(record.profession) ?? 0) + 1)
  }

  const categories = CATEGORIES.map((category) => ({
    ...category,
    count: activeCounts.get(category.name) ?? 0,
  }))
  const emptyCategories = categories.filter((category) => category.count === 0).length

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="category-statistics-title">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <BarChart3 aria-hidden="true" />
          </span>
          <div>
            <p className="font-black text-primary">Kategóriastatisztika</p>
            <h2 id="category-statistics-title" className="text-2xl font-black text-foreground">Aktív szakemberek szakmánként</h2>
          </div>
        </div>
        <p className={cn('text-sm font-bold', emptyCategories > 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {emptyCategories === 0 ? 'Minden kategóriában van szakember' : `${emptyCategories} üres kategória`}
        </p>
      </div>

      <div className="max-h-[34rem] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-card shadow-[0_1px_0_hsl(var(--border))]">
            <tr>
              <th scope="col" className="px-5 py-3 text-sm font-black text-muted-foreground">Szakma</th>
              <th scope="col" className="px-5 py-3 text-right text-sm font-black text-muted-foreground">Aktív adatlap</th>
              <th scope="col" className="px-5 py-3 text-right text-sm font-black text-muted-foreground"><span className="sr-only">Művelet</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => {
              const isEmpty = category.count === 0
              return (
                <tr key={category.key} className={cn(isEmpty && 'bg-destructive/10')}>
                  <th scope="row" className={cn('px-5 py-3 font-bold', isEmpty ? 'text-destructive' : 'text-foreground')}>
                    {category.name}
                  </th>
                  <td className="px-5 py-3 text-right">
                    <span className={cn('inline-flex min-w-9 justify-center rounded-full px-3 py-1 text-sm font-black', isEmpty ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-primary')}>
                      {category.count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/kategoria-ellenorzes?kategoria=${encodeURIComponent(category.name)}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 font-bold text-primary hover:bg-secondary">
                      Áttekintés és szerkesztés <ChevronRight aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
