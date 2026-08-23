import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { BarChart3, Clock3, LogOut, ShieldCheck, Star, Users } from 'lucide-react'
import { AdminCategoryStatistics } from '@/components/admin-category-statistics'
import { AdminCsvImport } from '@/components/admin-csv-import'
import { AdminLogin } from '@/components/admin-login'
import { AdminPendingReviewList } from '@/components/admin-pending-review-list'
import { AdminProfessionalList } from '@/components/admin-professional-list'
import { AdminReviewList } from '@/components/admin-review-list'
import { isAdmin } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { professionalReviews, professionals } from '@/lib/db/schema'
import { logoutAdmin } from './actions'

export const metadata = { title: 'Adminisztráció | Mesterek', description: 'A Mesterek védett adminisztrációs felülete.' }

export default async function AdminPage() {
  const authenticated = await isAdmin()
  if (!authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-foreground px-4 py-10 text-background"><AdminLogin /></main>
  }

  const [records, pendingRecords, reviews] = await Promise.all([
    db.select().from(professionals).orderBy(desc(professionals.createdAt)),
    db.select().from(professionals).where(eq(professionals.status, 'PENDING_REVIEW')).orderBy(desc(professionals.createdAt)),
    db.select({ id: professionalReviews.id, professionalId: professionalReviews.professionalId, professionalName: professionals.name, clientName: professionalReviews.clientName, rating: professionalReviews.rating, comment: professionalReviews.comment, verifiedContact: professionalReviews.verifiedContact, createdAt: professionalReviews.createdAt }).from(professionalReviews).innerJoin(professionals, eq(professionalReviews.professionalId, professionals.id)).orderBy(desc(professionalReviews.createdAt)).limit(500),
  ])
  const activeRecords = records.filter((item) => item.status === 'APPROVED')
  const inactiveRecords = records.filter((item) => item.status !== 'APPROVED' && item.status !== 'PENDING_REVIEW')
  const pendingReview = pendingRecords.length
  const activePriority = activeRecords.filter((item) => item.membershipTier === 'FEATURED' || item.isEmergency247).length

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ShieldCheck aria-hidden="true" /></span><div><p className="text-sm font-black uppercase tracking-widest text-accent">Mesterek</p><p className="text-xl font-black">Adminisztrációs központ</p></div></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Link href="/admin/statisztikak" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2 font-black text-accent-foreground"><BarChart3 aria-hidden="true" />Statisztikák</Link><form action={logoutAdmin}><button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-background px-5 py-2 font-black text-background hover:bg-background hover:text-foreground"><LogOut aria-hidden="true" />Kijelentkezés</button></form></div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <div><p className="font-black text-primary">Védett munkaterület</p><h1 className="mt-2 text-balance text-4xl font-black tracking-tight text-foreground md:text-5xl">Szakember-adatbázis kezelése</h1><p className="mt-3 max-w-3xl text-pretty leading-relaxed text-muted-foreground">Importáljon ellenőrzött szakemberadatokat, majd kezelje a platformon megjelenő adatlapokat.</p></div>

        <AdminCsvImport />

        <section className="grid gap-5 sm:grid-cols-3" aria-label="Adatbázis statisztikák">
          <Stat icon={Users} value={records.length} label="Összes szakember" />
          <Stat icon={Clock3} value={pendingReview} label="Függőben lévő regisztrációk" />
          <Stat icon={Star} value={activePriority} label="Aktív kiemelt szakemberek" />
        </section>

        <section aria-labelledby="quick-review-title">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-black text-primary">Minőségellenőrzés</p><div className="mt-1 flex flex-wrap items-center gap-3"><h2 id="quick-review-title" className="text-3xl font-black text-foreground">Regisztrációk jóváhagyása</h2><span className="inline-flex min-h-8 items-center rounded-full bg-accent px-3 py-1 text-sm font-black text-accent-foreground" aria-label={`${pendingReview} ellenőrzésre váró regisztráció`}>{pendingReview} várakozik</span></div><p className="mt-2 text-muted-foreground">Csak a jóváhagyott adatlapok jelennek meg a nyilvános keresőben és kategórialistákban.</p></div><Link href="/admin/kategoria-ellenorzes" className="btn-secondary">Részletes ellenőrzés</Link></div>
          <AdminPendingReviewList records={pendingRecords} />
        </section>

        <AdminCategoryStatistics records={records} />

        <AdminReviewList reviews={reviews} />

        <section className="min-w-0" aria-labelledby="professionals-title">
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-black text-primary">Aktív adatlapok</p><h2 id="professionals-title" className="mt-1 text-3xl font-black text-foreground">Jóváhagyott szakemberek kezelése</h2><p className="mt-2 text-muted-foreground">Kiemelés, SOS-hozzáférés, profiladatok és láthatóság kezelése.</p></div><p className="hidden font-bold text-muted-foreground sm:block">{activeRecords.length} aktív adatlap</p></div>
          <div className="max-w-full overflow-x-auto"><AdminProfessionalList records={activeRecords} /></div>
        </section>

        {inactiveRecords.length > 0 && <details className="rounded-2xl border border-border bg-card p-5"><summary className="cursor-pointer text-xl font-black text-foreground">Elutasított adatlapok ({inactiveRecords.length})</summary><div className="mt-5 max-w-full overflow-x-auto"><AdminProfessionalList records={inactiveRecords} /></div></details>}
      </div>
    </main>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><Icon className="size-7 text-primary" aria-hidden="true" /><p className="mt-4 text-3xl font-black text-foreground">{value}</p><p className="mt-1 font-bold text-muted-foreground">{label}</p></div>
}
