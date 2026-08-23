import Link from 'next/link'
import { desc, eq, gte, sql } from 'drizzle-orm'
import { ArrowLeft, BarChart3, Phone } from 'lucide-react'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { phoneLeadEvents, professionals } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export default async function StatisticsPage() {
  if (!(await isAdmin())) redirect('/admin')

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rankings = await db
    .select({
      id: professionals.id,
      name: professionals.name,
      profession: professionals.profession,
      city: professionals.city,
      phoneClicks: sql<number>`count(${phoneLeadEvents.id})::int`,
    })
    .from(phoneLeadEvents)
    .innerJoin(professionals, eq(phoneLeadEvents.professionalId, professionals.id))
    .where(gte(phoneLeadEvents.createdAt, since))
    .groupBy(professionals.id, professionals.name, professionals.profession, professionals.city)
    .orderBy(desc(sql`count(${phoneLeadEvents.id})`), professionals.name)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-primary">Mesterek admin</p>
            <h1 className="text-balance font-sans text-3xl font-black sm:text-5xl">Statisztikák</h1>
            <p className="text-base leading-relaxed text-muted-foreground">Telefonhívási érdeklődések az elmúlt 30 napban.</p>
          </div>
          <Link href="/admin" className="btn-outline"><ArrowLeft aria-hidden="true" /> Vissza a Vezérlőpultra</Link>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <BarChart3 className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black">Szakemberranglista</h2>
          </div>
          {rankings.length === 0 ? (
            <p className="p-8 text-center text-base text-muted-foreground">Az elmúlt 30 napban még nem érkezett telefonos érdeklődés.</p>
          ) : (
            <ol className="divide-y divide-border">
              {rankings.map((contractor, index) => (
                <li key={contractor.id} className="flex items-center gap-4 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-black text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">{contractor.name}</p>
                    <p className="text-sm text-muted-foreground">{contractor.profession} · {contractor.city}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-right text-primary">
                    <Phone aria-hidden="true" />
                    <span className="text-2xl font-black">{contractor.phoneClicks}</span>
                    <span className="sr-only">telefonkattintás</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  )
}
