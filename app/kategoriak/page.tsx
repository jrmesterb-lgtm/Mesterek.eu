import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CATEGORIES } from '@/lib/constants'

export const metadata = { title: 'Szakmai kategóriák' }
export default function CategoriesPage() {
  return <AppShell><div className="page-wrap"><h1 className="page-title">Milyen szakembert keres?</h1><p className="page-lead">Válasszon az alábbi kategóriák közül. A következő oldalon település szerint is szűrhet.</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{CATEGORIES.map(({ name, icon: Icon, description }) => <Link key={name} href={`/kereses?kategoria=${encodeURIComponent(name)}`} className="surface group flex min-h-64 flex-col justify-between transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"><span className="flex size-16 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-9" strokeWidth={2.25} aria-hidden="true" /></span><div><h2 className="mt-5 text-2xl font-black text-primary">{name}</h2><p className="mt-2 text-lg leading-relaxed text-muted-foreground">{description}</p></div><span className="mt-5 flex items-center gap-2 text-lg font-black text-primary">Mutassa a szakembereket <ArrowRight className="size-6" aria-hidden="true" /></span></Link>)}</div></div></AppShell>
}
