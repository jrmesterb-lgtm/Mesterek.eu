import Link from 'next/link'
import { RotateCcw, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { DynamicSearchForm } from '@/components/dynamic-search-form'
import { ExternalProfessionalCard } from '@/components/external-professional-card'
import { ProfessionalResults } from '@/components/professional-results'
import { CATEGORIES } from '@/lib/constants'
import { locationByCountyAndCity } from '@/lib/hungary-locations'
import { recordExternalPlaceLeads } from '@/lib/external-place-leads'
import { searchGooglePlaces } from '@/lib/google-places'
import { getProfessionalLocationAvailability, searchProfessionals } from '@/lib/professionals'

export const metadata = { title: 'Szakember keresése' }

type Params = { q?: string; kategoria?: string; megye?: string; telepules?: string; iranyitoszam?: string; sos?: string }
type Props = { searchParams: Promise<Params> }

function categoryHref(category: string, params: Params) {
  const next = new URLSearchParams({ kategoria: category })
  if (params.q) next.set('q', params.q)
  if (params.sos === '1') next.set('sos', '1')
  return `/kereses?${next.toString()}`
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const emergencyOnly = params.sos === '1'
  const availability = await getProfessionalLocationAvailability(emergencyOnly)

  const results = await searchProfessionals({ query: params.q, category: params.kategoria, county: params.megye, city: params.telepules, zipCode: params.iranyitoszam, emergency247: emergencyOnly })
  const hasFilters = Boolean(params.q || params.kategoria || params.megye || params.telepules || params.iranyitoszam || emergencyOnly)
  const resultsKey = [params.q, params.kategoria, params.megye, params.telepules, params.iranyitoszam, emergencyOnly ? '1' : ''].map((value) => value ?? '').join('|')
  const validCategory = CATEGORIES.some((category) => category.name === params.kategoria)
  const validTown = Boolean(params.megye && params.telepules && locationByCountyAndCity(params.megye, params.telepules))
  const shouldUsePlaces = !emergencyOnly && results.total === 0 && validCategory && validTown
  const placesResult = shouldUsePlaces
    ? await searchGooglePlaces(params.kategoria!, params.telepules!)
    : { status: 'success' as const, places: [] }
  if (shouldUsePlaces && placesResult.status === 'success') {
    await recordExternalPlaceLeads(placesResult.places.map((place) => place.placeId), params.kategoria!, params.telepules!)
  }

  return <AppShell><div className="page-wrap">
    <h1 className="page-title">{emergencyOnly ? 'SOS Gyorsszolgálat 0-24' : 'Szakember keresése'}</h1>
    <p className="page-lead">{emergencyOnly ? 'Éjjel-nappal elérhető, jóváhagyott gyorsszolgálati szakemberek.' : 'Szűrjön szakma, település vagy irányítószám szerint. A feltételek együtt is használhatók.'}</p>
    <DynamicSearchForm availability={availability} defaults={{ q: params.q, category: params.kategoria, county: params.megye, city: params.telepules, zipCode: params.iranyitoszam }} collapseAfterSearch={hasFilters} hiddenFields={emergencyOnly ? { sos: '1' } : undefined} />
    {hasFilters && <div className="mt-6 flex items-center gap-3"><Users className="size-7 text-primary" aria-hidden="true" /><h2 className="text-2xl font-black">{results.total > 0 ? `${results.total} regisztrált szakember található` : placesResult.places.length > 0 ? `${placesResult.places.length} helyi vállalkozás található` : 'Nincs találat'}</h2></div>}
    {hasFilters && results.total > 0 && <div className="mt-5"><ProfessionalResults key={resultsKey} initialItems={results.items} total={results.total} initialHasMore={results.hasMore} filters={{ q: params.q, kategoria: params.kategoria, megye: params.megye, telepules: params.telepules, iranyitoszam: params.iranyitoszam, sos: emergencyOnly ? '1' : undefined }} /></div>}
    {hasFilters && results.total === 0 && placesResult.places.length === 0 && <div className="surface mt-5 text-center"><Users className="mx-auto size-12 text-primary" aria-hidden="true" /><h2 className="mt-4 text-2xl font-black">Nincs találat</h2><p className="mx-auto mt-2 max-w-2xl text-muted-foreground">A megadott feltételekkel nem található regisztrált szakember. Módosítsa a szűrőket, vagy próbáljon másik települést.</p></div>}
    {hasFilters && placesResult.places.length > 0 && <section className="mt-10" aria-labelledby="external-results"><div className="mb-4 border-t border-border pt-6"><h3 id="external-results" className="text-lg font-black text-foreground">További helyi vállalkozások</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Nem ellenőrzött, díjmentesen megjelenő adatlapok. Az adatok közvetlenül a Google Places szolgáltatásból származnak, ezért idővel változhatnak.</p></div><div className="flex flex-col gap-3">{placesResult.places.map((place) => <ExternalProfessionalCard key={place.placeId} place={place} trade={params.kategoria!} town={params.telepules!} />)}</div></section>}
    <div className="mt-5 flex flex-col gap-5">
      {hasFilters && results.total === 0 && placesResult.places.length === 0 && <div className="surface text-center"><Users className="mx-auto size-12 text-primary" aria-hidden="true" /><h2 className="mt-4 text-2xl font-black">Ismer megbízható szakembert?</h2><p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Ajánlja neki a Mestereket, hogy jóváhagyás után mások is könnyen megtalálhassák ezen a területen.</p><Link href="/regisztracio" className="btn-primary mt-5">Szakember ajánlása</Link></div>}
    </div>
    {placesResult.places.length > 0 && <p className="mt-6 text-center text-sm font-bold text-muted-foreground">Google Places-adatok · A Google és a Google Maps a Google LLC védjegyei.</p>}
    {hasFilters && <div className="mt-6 flex justify-end"><Link href="/kereses" className="btn-outline"><RotateCcw aria-hidden="true" />Szűrők törlése</Link></div>}
    <section className="mt-12 border-t border-border pt-10" aria-labelledby="quick-categories"><h2 id="quick-categories" className="text-2xl font-black text-primary">Gyors választás szakma szerint</h2><p className="mt-2 text-lg text-muted-foreground">Válassza ki a keresett szakmát az alábbi lehetőségek közül.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{CATEGORIES.map(({ key, name, icon: Icon }) => { const active = params.kategoria === name; return <Link key={key} href={categoryHref(name, params)} aria-current={active ? 'page' : undefined} className={`flex min-h-20 items-center gap-4 rounded-xl border-2 p-4 text-lg font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-primary hover:border-primary'}`}><span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary-foreground/15' : 'bg-secondary'}`}><Icon className="size-7" strokeWidth={2.25} aria-hidden="true" /></span>{name}</Link> })}</div></section>
  </div></AppShell>
}
