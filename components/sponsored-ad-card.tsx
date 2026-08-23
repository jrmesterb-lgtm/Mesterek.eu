import { ExternalLink, ShoppingBag, Wrench } from 'lucide-react'

export type SponsoredAd = {
  id: string
  icon: 'shop' | 'tools'
  headline: string
  description: string
  cta: string
  href: string
  advertiser: string
}

/** Mock inventory. Swap for a real ad-server response when the sponsorship product ships. */
export const MOCK_SPONSORED_ADS: SponsoredAd[] = [
  {
    id: 'ad-villany',
    icon: 'shop',
    headline: 'Prémium villanyszerelési anyagok 20% kedvezménnyel!',
    description: 'Minden, ami a profi munkához kell. Gyors kiszállítás, szakértő eladók.',
    cta: 'Katalógus megtekintése',
    href: '#',
    advertiser: 'ElektroPro Nagyker',
  },
  {
    id: 'ad-szerszam',
    icon: 'tools',
    headline: 'Akkus szerszámgépek akciós készletben',
    description: 'Márkás gépek 3 év garanciával, ingyenes házhoz szállítással 50 000 Ft felett.',
    cta: 'Ajánlatok böngészése',
    href: '#',
    advertiser: 'SzerszámCentrum',
  },
]

const ICONS = { shop: ShoppingBag, tools: Wrench }

export function SponsoredAdCard({ ad }: { ad: SponsoredAd }) {
  const Icon = ICONS[ad.icon]

  return (
    <article
      aria-label={`Hirdetés: ${ad.advertiser}`}
      className="relative flex w-full max-w-full min-w-0 flex-col gap-5 overflow-hidden rounded-3xl border border-dashed border-primary/45 bg-secondary/45 p-5 pt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl sm:pt-5"
    >
      <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-black uppercase tracking-wide text-primary/80 sm:right-5 sm:top-5">
        Hirdetés
      </span>

      <div className="flex min-w-0 max-w-full flex-1 gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-primary ring-1 ring-primary/25"
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 max-w-full sm:pr-24">
          <h3 className="max-w-full break-words text-pretty text-lg font-black text-primary [overflow-wrap:anywhere] sm:text-xl">
            {ad.headline}
          </h3>
          <p className="mt-1 max-w-full break-words text-pretty text-base leading-relaxed text-foreground/80 [overflow-wrap:anywhere]">
            {ad.description}
          </p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">{ad.advertiser} · Szponzorált tartalom</p>
        </div>
      </div>

      <div className="w-full sm:w-auto sm:min-w-64">
        <a
          href={ad.href}
          rel="nofollow sponsored noopener"
          className="btn-outline w-full border-primary/70 text-base"
        >
          <ExternalLink className="size-5" aria-hidden="true" />
          {ad.cta}
        </a>
      </div>
    </article>
  )
}
