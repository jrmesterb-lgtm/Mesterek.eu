import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BrickWall, Droplets, PaintRoller, PlugZap, Search, UserPlus, Wrench } from 'lucide-react'
import { AiSmartSearch } from '@/components/ai-smart-search'
import { AppShell } from '@/components/app-shell'
import { DynamicSearchForm } from '@/components/dynamic-search-form'
import { HeroTagline } from '@/components/hero-tagline'
import { getProfessionalLocationAvailability } from '@/lib/professionals'

export const metadata = { title: 'Mesterek – Megbízható helyi szakemberek' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const availability = await getProfessionalLocationAvailability()
  const approvedProfessions = new Set(availability.map((item) => item.profession))
  return <AppShell>
    <main>
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <Image src="/images/architectural-blueprint.png" alt="" fill priority className="pointer-events-none -z-10 object-cover object-right-bottom opacity-70" />
        <div className="mx-auto flex min-h-[calc(100svh-84px)] max-w-6xl flex-col items-center px-4 py-6 text-center md:min-h-0 md:px-8 md:py-20">
          <HeroTagline text="A megbízható szakemberek keresője." className="max-w-4xl px-3 py-2 text-center font-sans text-xl font-black leading-snug tracking-tight text-accent drop-shadow-sm md:px-6 md:text-4xl" />
          <div className="mt-4 flex w-full justify-center md:mt-6"><AiSmartSearch /></div>
          <div className="mt-5 flex flex-col items-center gap-3 md:mt-7 md:flex-row md:gap-5"><h1 className="text-balance text-3xl font-black leading-tight md:text-5xl">Milyen szakembert keres?</h1><span className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-black text-accent-foreground md:text-base">Ingyenes használat</span></div>

          <div className="w-full max-w-5xl text-left"><DynamicSearchForm availability={availability} compact /></div>

          <nav className="mt-5 hidden w-full md:block" aria-label="Népszerű szakmák">
            <div className="grid grid-cols-4 gap-2 md:mx-auto md:max-w-3xl md:gap-4">{[
              ['Villanyszerelés', 'Villanyszerelés', PlugZap],
              ['Víz- és fűtésszerelés', 'Víz-, gáz-, fűtésszerelés', Droplets],
              ['Festés', 'Szobafestő', PaintRoller],
              ['Építés', 'Kőműves', BrickWall],
            ].filter(([, category]) => approvedProfessions.has(category as string)).map(([label, category, Icon]) => { const CategoryIcon = Icon as typeof Wrench; return <Link key={label as string} href={`/kereses?kategoria=${encodeURIComponent(category as string)}`} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary-foreground/55 bg-primary/80 px-2 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm backdrop-blur-sm transition hover:border-accent hover:bg-primary-foreground/10 md:min-h-32 md:text-base"><span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground transition group-hover:scale-105 md:size-14"><CategoryIcon className="size-6 md:size-8" aria-hidden="true" /></span>{label as string}</Link> })}</div>
          </nav>

          <div className="mt-5 hidden flex-col gap-4 md:flex sm:flex-row"><Link href="/kereses" className="btn-accent"><Search aria-hidden="true" />Részletes keresés</Link><Link href="/regisztracio" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border-2 border-primary-foreground px-6 py-3 text-lg font-black hover:bg-primary-foreground/10"><UserPlus aria-hidden="true" />Szakember vagyok</Link></div>
        </div>
      </section>
      <section className="page-wrap hidden md:block"><div className="text-center"><h2 className="page-title">Három egyszerű lépés</h2><p className="page-lead mx-auto">A Mesterek használatához nincs szükség fiókra vagy letöltésre.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[['1','Keressen','Adja meg, milyen munkára és melyik településen keres segítséget.'],['2','Válasszon','Olvassa el a szakemberek bemutatkozását és válassza ki a megfelelőt.'],['3','Telefonáljon','Nyomja meg a hívás gombot, és beszéljen közvetlenül a szakemberrel.']].map(([n,t,d]) => <article key={n} className="surface"><span className="flex size-12 items-center justify-center rounded-full bg-accent text-xl font-black text-accent-foreground">{n}</span><h3 className="mt-5 text-2xl font-black text-primary">{t}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{d}</p></article>)}</div><div className="mt-10 flex justify-center"><Link href="/kategoriak" className="btn-outline">Szakmák megtekintése <ArrowRight aria-hidden="true" /></Link></div></section>
    </main>
  </AppShell>
}
