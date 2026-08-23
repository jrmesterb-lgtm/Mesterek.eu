import { ShieldCheck, Star, Trash2 } from 'lucide-react'
import { deleteReview } from '@/app/admin/actions'

export type AdminReview = {
  id: number
  professionalId: number
  professionalName: string
  clientName: string
  rating: number
  comment: string
  verifiedContact: boolean
  createdAt: Date
}

export function AdminReviewList({ reviews }: { reviews: AdminReview[] }) {
  return <section aria-labelledby="reviews-title"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-black text-primary">Moderáció</p><h2 id="reviews-title" className="mt-1 text-3xl font-black text-foreground">Vélemények kezelése</h2><p className="mt-2 text-muted-foreground">Az értékelések azonnal megjelennek; itt bármelyik eltávolítható.</p></div><p className="hidden font-bold text-muted-foreground sm:block">{reviews.length} vélemény</p></div><div className="flex flex-col gap-4">{reviews.length === 0 ? <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Még nincs beküldött vélemény.</p> : reviews.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{review.clientName}</p>{review.verifiedContact && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-black text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Ellenőrzött hívás</span>}</div><p className="mt-1 font-bold text-primary">{review.professionalName}</p><div className="mt-2 flex gap-0.5" aria-label={`${review.rating} csillag`}>{[1,2,3,4,5].map((star) => <Star key={star} className={`size-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} aria-hidden="true" />)}</div><p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{review.comment}</p><p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(review.createdAt)}</p></div><form action={deleteReview}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="professionalId" value={review.professionalId} /><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-4 font-black text-destructive-foreground" aria-label={`${review.clientName} véleményének törlése`}><Trash2 className="size-4" aria-hidden="true" />Törlés</button></form></div></article>)}</div></section>
}
