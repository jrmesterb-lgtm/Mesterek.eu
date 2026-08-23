'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'

// Accent-insensitive, case-insensitive normalizer so "kolto" matches
// "Költöztetés" and "vizszereles" matches "Víz-, gáz-, fűtésszerelés".
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('hu-HU')
}

export function CategorySearch() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return CATEGORIES
    return CATEGORIES.filter(({ name }) => normalize(name).includes(q))
  }, [query])

  return (
    <>
      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Keress a szakmák között..."
          aria-label="Keress a szakmák között"
          className="field-input pl-12"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({ name, icon: Icon, description }) => (
            <Link key={name} href={`/kereses?kategoria=${encodeURIComponent(name)}`} className="surface group flex min-h-64 flex-col justify-between transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring">
              <span className="flex size-16 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-9" strokeWidth={2.25} aria-hidden="true" /></span>
              <div><h2 className="mt-5 text-2xl font-black text-primary">{name}</h2><p className="mt-2 text-lg leading-relaxed text-muted-foreground">{description}</p></div>
              <span className="mt-5 flex items-center gap-2 text-lg font-black text-primary">Mutassa a szakembereket <ArrowRight className="size-6" aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-lg text-muted-foreground">Nincs találat. Kérjük, próbálj más kifejezést.</p>
      )}
    </>
  )
}
