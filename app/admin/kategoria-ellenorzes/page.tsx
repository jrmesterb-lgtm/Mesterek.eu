import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { ArrowLeft, Building2, ExternalLink, MapPin, SearchCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AdminCategoryReviewActions } from '@/components/admin-category-review-actions'
import { CATEGORIES } from '@/lib/constants'
import { isAdmin } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { professionals } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Kategória-ellenőrzés | Mesterek', description: 'Szakember-adatlapok kategóriánkénti áttekintése és javítása.' }

export default async function CategoryReviewPage({ searchParams }: { searchParams: Promise<{ kategoria?: string }> }) {
  if (!(await isAdmin())) redirect('/admin')
  const requestedCategory = (await searchParams).kategoria
  const selectedCategory = CATEGORIES.find((category) => category.name === requestedCategory)?.name ?? CATEGORIES[0].name
  const records = await db.select().from(professionals).where(eq(professionals.profession, selectedCategory)).orderBy(asc(professionals.name), asc(professionals.id))

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div><p className="font-black uppercase tracking-widest text-accent">Adattisztítás</p><h1 className="mt-1 text-3xl font-black">Kategória áttekintése és szerkesztése</h1></div>
          <Link href="/admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-background px-4 font-black"><ArrowLeft aria-hidden="true" />Vissza az adminfelületre</Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="category-filter-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="font-black text-primary">Gyors ellenőrzés</p><h2 id="category-filter-title" className="mt-1 text-3xl font-black text-foreground">{selectedCategory}</h2><p className="mt-2 text-muted-foreground">{records.length} adatlap ebben a kategóriában, minden állapotot beleértve.</p></div>
            <form action="/admin/kategoria-ellenorzes" className="flex w-full max-w-xl gap-2">
              <label className="sr-only" htmlFor="category">Kategória</label>
              <select id="category" name="kategoria" defaultValue={selectedCategory} className="min-h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 font-bold text-foreground">
                {CATEGORIES.map((category) => <option key={category.key} value={category.name}>{category.name}</option>)}
              </select>
              <button type="submit" className="btn-primary min-h-12"><SearchCheck aria-hidden="true" />Megnyitás</button>
            </form>
          </div>
        </section>

        {records.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><SearchCheck className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 text-2xl font-black">Nincs ellenőrizhető adatlap</h2><p className="mt-2 text-muted-foreground">Ebben a kategóriában jelenleg egyetlen aktív, függőben lévő vagy felfüggesztett adatlap sincs.</p></section>
        ) : (
          <section className="flex flex-col gap-4" aria-label={`${selectedCategory} adatlapjai`}>
            {records.map((record) => (
              <article key={record.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black text-foreground">{record.name}</h2><span className={cn('rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide', record.status === 'APPROVED' ? 'bg-secondary text-primary' : record.status === 'PENDING_REVIEW' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{record.status === 'APPROVED' ? 'Jóváhagyva' : record.status === 'PENDING_REVIEW' ? 'Ellenőrzésre vár' : 'Elutasítva'}</span></div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground"><span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" />{record.city}</span><span className="inline-flex items-center gap-2"><Building2 aria-hidden="true" />Forráskategória: {record.query || 'nincs megadva'}</span>{record.website && <a href={record.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline"><ExternalLink aria-hidden="true" />Weboldal</a>}</div>
                    <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{record.description}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{record.phone}{record.email ? ` · ${record.email}` : ''}</p>
                  </div>
                  <AdminCategoryReviewActions id={record.id} currentCategory={record.profession} status={record.status} />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
