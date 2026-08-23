'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, ExternalLink, MapPin, Phone, Star } from 'lucide-react'
import type { ExternalPlace } from '@/lib/google-places'

export function ExternalProfessionalCard({ place, trade, town }: { place: ExternalPlace; trade: string; town: string }) {
  const [showPhone, setShowPhone] = useState(false)
  const claimParams = new URLSearchParams({ placeId: place.placeId, szakma: trade, telepules: town })

  return <article className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 max-w-full flex-1 gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Building2 className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nem ellenőrzött · Külső adatforrás</span>
        <h2 className="mt-1 max-w-full break-words text-base font-black text-foreground [overflow-wrap:anywhere] sm:text-lg">{place.name}</h2>
        <p className="max-w-full break-words text-sm font-bold text-muted-foreground [overflow-wrap:anywhere]">{trade}</p>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{place.address}</p>
        {place.rating !== undefined && <p className="mt-2 flex items-center gap-2 text-sm font-bold"><Star className="size-4 fill-current text-accent" aria-hidden="true" />{place.rating.toFixed(1)} {place.ratingCount !== undefined && <span className="font-normal text-muted-foreground">({place.ratingCount} Google-értékelés)</span>}</p>}
        <Link href={`/regisztracio?${claimParams.toString()}`} className="mt-4 inline-block text-sm font-bold text-primary underline decoration-2 underline-offset-4">Öné ez a vállalkozás? Igényelje profilját!</Link>
      </div>
    </div>
    <div className="flex shrink-0 flex-col gap-2 sm:w-56">
      {place.phone && (showPhone ? <a href={`tel:${place.phone.replace(/\s/g, '')}`} className="btn-outline min-h-12 text-sm"><Phone className="size-4" aria-hidden="true" />{place.phone}</a> : <button type="button" onClick={() => setShowPhone(true)} className="btn-outline min-h-12 text-sm"><Phone className="size-4" aria-hidden="true" />Telefonszám mutatása</button>)}
      {place.mapsUri && <a href={place.mapsUri} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-muted-foreground underline underline-offset-4"><ExternalLink className="size-4" aria-hidden="true" />Megnyitás térképen</a>}
    </div>
  </article>
}
