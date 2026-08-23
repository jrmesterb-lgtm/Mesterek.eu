'use client'

import { useEffect, useState } from 'react'
import type { Professional } from '@/lib/db/schema'
import { ProfessionalCard } from '@/components/professional-card'

type Filters = { q?: string; kategoria?: string; megye?: string; telepules?: string; iranyitoszam?: string; sos?: string }
type DirectoryProfessional = Professional & { gallery?: Array<{ id: number; altText: string }>; averageRating?: number; reviewCount?: number }
type Props = { initialItems: DirectoryProfessional[]; total: number; initialHasMore: boolean; filters: Filters }

export function ProfessionalResults({ initialItems, total, initialHasMore, filters }: Props) {
  const [items, setItems] = useState(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setItems(initialItems)
    setHasMore(initialHasMore)
    setLoading(false)
    setError('')
  }, [initialItems, initialHasMore, filters.q, filters.kategoria, filters.megye, filters.telepules, filters.iranyitoszam, filters.sos])

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
      params.set('offset', String(items.length))
      const response = await fetch(`/api/professionals?${params.toString()}`)
      if (!response.ok) throw new Error('A további találatok nem tölthetők be.')
      const data = await response.json() as { items: DirectoryProfessional[]; hasMore: boolean }
      setItems((current) => [...current, ...data.items.filter((next) => !current.some((item) => item.id === next.id))])
      setHasMore(data.hasMore)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A további találatok nem tölthetők be.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="flex w-full max-w-full min-w-0 flex-col gap-8">
    {items.length > 0 && <section className="min-w-0 max-w-full" aria-labelledby="professional-results"><div className="mb-4"><h3 id="professional-results" className="text-xl font-black text-primary">Szakemberek</h3><p className="mt-1 text-sm text-muted-foreground">Az összes találat egy helyen, elérhetőség, közelség és értékelések szerint rendezve.</p></div><div className="flex flex-col gap-6">{items.map((item) => <ProfessionalCard key={item.id} professional={item} />)}</div></section>}
    {hasMore && <div className="flex flex-col items-center gap-3"><button type="button" className="btn-outline min-h-14 px-6" onClick={loadMore} disabled={loading}>{loading ? 'Betöltés…' : 'További szakemberek betöltése'}</button><p className="text-sm font-bold text-muted-foreground">{items.length} / {total} szakember megjelenítve</p></div>}
    {error && <p role="alert" className="text-center font-bold text-destructive">{error}</p>}
  </div>
}
