'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Star, Trash2 } from 'lucide-react'
import { deleteReview } from '@/app/admin/actions'
import { ADMIN_PAGE_SIZE, AdminPagination } from '@/components/admin-pagination'

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
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(reviews.length / ADMIN_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleReviews = reviews.slice((safePage - 1) * ADMIN_PAGE_SIZE, safePage * ADMIN_PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (reviews.length === 0) return <p className="p-6 text-muted-foreground">Még nincs beküldött vélemény.</p>

  return (
    <div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {visibleReviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{review.clientName}</p>{review.verifiedContact && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-black text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Ellenőrzött hívás</span>}</div>
                <p className="mt-1 font-bold text-primary">{review.professionalName}</p>
                <div className="mt-2 flex gap-0.5" aria-label={`${review.rating} csillag`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`size-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} aria-hidden="true" />)}</div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{review.comment}</p>
                <p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(review.createdAt))}</p>
              </div>
              <form action={deleteReview}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="professionalId" value={review.professionalId} /><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-2 font-black text-destructive transition hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="size-4" aria-hidden="true" />Törlés</button></form>
            </div>
          </article>
        ))}
      </div>
      <AdminPagination page={safePage} totalItems={reviews.length} onPageChange={setPage} />
    </div>
  )
}
