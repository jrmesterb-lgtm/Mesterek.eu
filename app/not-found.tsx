import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Search, Wrench } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'A keresett oldal nem található',
  description: 'Ezt az oldalt nem találjuk. Keress megbízható szakembert a Mesterek.eu főoldalán.',
}

export default function NotFound() {
  return (
    <AppShell>
      <div className="bg-muted/40">
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-12 text-center md:py-20">
          {/* FRIENDLY THEMED ICON */}
          <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md md:size-28">
            <Wrench className="size-12 -rotate-12 md:size-14" strokeWidth={2.25} />
          </span>

          <p className="mt-6 text-6xl font-black leading-none tracking-tight text-primary md:text-8xl">404</p>

          <h1 className="mt-4 text-balance text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Hoppá, itt valami eltört!
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Ezt az oldalt sajnos nem találjuk. De ne aggódj, a szervereinket nem öntötte el a víz! Keress inkább egy megbízható szakembert a főoldalon.
          </p>

          {/* ACTIONS */}
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/" className="btn-primary">
              <Home aria-hidden="true" />Vissza a főoldalra
            </Link>
            <Link href="/kereses" className="btn-outline">
              <Search aria-hidden="true" />Szakemberek keresése
            </Link>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
