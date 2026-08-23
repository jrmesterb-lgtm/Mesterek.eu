import type { Metadata } from 'next'
import Link from 'next/link'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { ArrowLeft, BriefcaseBusiness, Flame, Globe, MapPin, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { RatingSummary } from '@/components/rating-summary'
import { ReviewForm } from '@/components/review-form'
import { TrackedCallLink } from '@/components/tracked-call-link'
import { db } from '@/lib/db'
import { professionalReviews, professionals } from '@/lib/db/schema'

type Props = { params: Promise<{ id: string }> }

async function getProfessional(id: string) {
  const parsedId = Number.parseInt(id, 10)
  if (!Number.isInteger(parsedId) || parsedId <= 0) return null
  const [professional] = await db.select().from(professionals).where(and(eq(professionals.id, parsedId), eq(professionals.status, 'APPROVED'))).limit(1)
  return professional ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const professional = await getProfessional((await params).id)
  if (!professional) return { title: 'Szakember nem található' }
  return { title: `${professional.name} – ${professional.profession}`, description: professional.description.slice(0, 160) }
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const professional = await getProfessional((await params).id)
  if (!professional) notFound()
  const phone = professional.phone.replace(/\s/g, '')
  const whatsapp = (professional.whatsappPhone || professional.phone).replace(/\D/g, '').replace(/^06/, '36')
  const [reviews, [summary]] = await Promise.all([
    db.select().from(professionalReviews).where(eq(professionalReviews.professionalId, professional.id)).orderBy(desc(professionalReviews.createdAt)).limit(50),
    db.select({ reviewCount: count(), averageRating: sql<number>`round(avg(${professionalReviews.rating})::numeric, 1)` }).from(professionalReviews).where(eq(professionalReviews.professionalId, professional.id)),
  ])
  const reviewCount = summary?.reviewCount ?? 0
  const averageRating = Number(summary?.averageRating ?? 0)

  return <AppShell><main className="page-wrap"><Link href="/kereses" className="inline-flex items-center gap-2 font-black text-primary hover:underline"><ArrowLeft className="size-5" aria-hidden="true" />Vissza a kereséshez</Link><article className="mt-6 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl"><header className="bg-primary p-6 text-primary-foreground md:p-10"><div className="flex flex-wrap items-center gap-3">{professional.verifiedAt && <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-black"><ShieldCheck className="size-5" aria-hidden="true" />Ellenőrzött</span>}{professional.isEmergency247 && <span className="sos-badge" aria-label="SOS, éjjel-nappal elérhető"><span className="sos-dot" aria-hidden="true" /><Flame className="size-5" aria-hidden="true" />SOS 0-24</span>}</div><h1 className="mt-5 text-balance text-4xl font-black md:text-6xl">{professional.name}</h1><p className="mt-3 flex items-center gap-2 text-xl font-bold"><BriefcaseBusiness aria-hidden="true" />{professional.profession}</p><p className="mt-2 flex items-center gap-2 font-bold text-primary-foreground/85"><MapPin aria-hidden="true" />{professional.zipCode ? `${professional.zipCode} ` : ''}{professional.address || professional.city}</p><div className="mt-5"><RatingSummary average={averageRating} count={reviewCount} inverse /></div></header><div className="grid gap-8 p-6 md:grid-cols-[1fr_18rem] md:p-10"><div><h2 className="text-2xl font-black text-primary">Bemutatkozás</h2><p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-foreground">{professional.extendedBio || professional.description}</p></div><aside className="flex flex-col gap-3"><TrackedCallLink contractorId={professional.id} phone={phone} label="Hívás most" displayPhone={professional.phone} featured />{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-outline"><MessageCircle aria-hidden="true" />WhatsApp</a>}{professional.website && <a href={professional.website} target="_blank" rel="noopener noreferrer" className="btn-outline"><Globe aria-hidden="true" />Weboldal</a>}</aside></div></article><section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]" aria-labelledby="reviews-title"><div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-black text-primary">Ügyfélvélemények</p><h2 id="reviews-title" className="mt-1 text-3xl font-black text-foreground">Tapasztalatok erről a Mesterről</h2></div><RatingSummary average={averageRating} count={reviewCount} /></div><div className="mt-6 flex flex-col gap-4">{reviews.length ? reviews.map((review) => <article key={review.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{review.clientName}</p>{review.verifiedContact && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-black text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Ellenőrzött hívás utáni értékelés</span>}</div><div className="flex gap-0.5" aria-label={`${review.rating} csillagos értékelés`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`size-5 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/35'}`} aria-hidden="true" />)}</div></div>{review.comment && <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{review.comment}</p>}<time className="mt-3 block text-sm font-bold text-muted-foreground" dateTime={review.createdAt.toISOString()}>{new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' }).format(review.createdAt)}</time></article>) : <div className="rounded-xl border border-dashed border-border bg-card p-6"><p className="font-black text-foreground">Legyen Ön az első értékelő.</p><p className="mt-2 text-muted-foreground">Ossza meg tapasztalatát ezzel a szakemberrel kapcsolatban.</p></div>}</div></div><ReviewForm professionalId={professional.id} /></section></main></AppShell>
}
