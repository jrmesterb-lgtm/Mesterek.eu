'use client'

import { Fragment, useEffect, useState } from 'react'
import type { Professional } from '@/lib/db/schema'
import { useAdDemo } from '@/components/ad-demo-context'
import { ProfessionalCard } from '@/components/professional-card'
import { MOCK_SPONSORED_ADS, SponsoredAdCard } from '@/components/sponsored-ad-card'

/** Native ad placements, keyed by the 1-based position of the professional the ad follows. */
const AD_SLOTS = new Map([
  [2, MOCK_SPONSORED_ADS[0]],
  [5, MOCK_SPONSORED_ADS[1]],
])

type Filters = { q?: string; kategoria?: string; megye?: string; telepules?: string; iranyitoszam?: string; sos?: string }
type DirectoryProfessional = Professional & { gallery?: Array<{ id: number; altText: string }>; averageRating?: number; reviewCount?: number }
type Props = { initialItems: DirectoryProfessional[]; total: number; initialHasMore: boolean; filters: Filters }

export function ProfessionalResults({ initialItems, total, initialHasMore, filters }: Props) {
  const { isAdDemoActive } = useAdDemo()
  const [items, setItems] = useState(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    setItems(initialItems)
    setHasMore(initialHasMore)
    setLoading(false)
    setError('')
    // Simulate a brief fetch so freshly filtered results reveal with a native-app style loading state.
    setShowSkeleton(true)
    const timer = setTimeout(() => setShowSkeleton(false), 1000)
    return () => clearTimeout(timer)
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

  if (showSkeleton) {
    return <div className="flex w-full max-w-full min-w-0 flex-col gap-8">
      <section className="min-w-0 max-w-full" aria-busy="true" aria-live="polite"><div className="mb-4"><h3 className="text-xl font-black text-primary">Szakemberek</h3><p className="mt-1 text-sm text-muted-foreground">Találatok betöltése…</p></div><div className="flex flex-col gap-6">{[0, 1, 2].map((key) => <SkeletonCard key={key} />)}</div></section>
    </div>
  }

  return <div className="flex w-full max-w-full min-w-0 flex-col gap-8">
    {items.length > 0 && <section className="min-w-0 max-w-full" aria-labelledby="professional-results"><div className="mb-4"><h3 id="professional-results" className="text-xl font-black text-primary">Szakemberek</h3><p className="mt-1 text-sm text-muted-foreground">Az összes találat egy helyen, elérhetőség, közelség és értékelések szerint rendezve.</p></div><div className="flex flex-col gap-6">{items.map((item, index) => {
      const ad = isAdDemoActive ? AD_SLOTS.get(index + 1) : undefined
      return <Fragment key={item.id}>
        <ProfessionalCard professional={item} />
        {ad && <SponsoredAdCard ad={ad} />}
      </Fragment>
    })}</div></section>}
    {hasMore && <div className="flex flex-col items-center gap-3"><button type="button" className="btn-outline min-h-14 px-6" onClick={loadMore} disabled={loading}>{loading ? 'Betöltés…' : 'További szakemberek betöltése'}</button><p className="text-sm font-bold text-muted-foreground">{items.length} / {total} szakember megjelenítve</p></div>}
    {error && <p role="alert" className="text-center font-bold text-destructive">{error}</p>}
  </div>
}

function SkeletonCard() {
  return <div className="flex w-full max-w-full min-w-0 animate-pulse flex-col gap-5 rounded-3xl border border-border/65 bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl" aria-hidden="true">
    <div className="flex min-w-0 flex-1 gap-4">
      <span className="size-12 shrink-0 rounded-full bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="h-5 w-1/2 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="flex gap-2"><span className="h-6 w-20 rounded-full bg-muted" /><span className="h-6 w-24 rounded-full bg-muted" /></div>
      </div>
    </div>
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-96"><span className="h-12 rounded-xl bg-muted" /><span className="h-12 rounded-xl bg-muted" /></div>
  </div>
}
