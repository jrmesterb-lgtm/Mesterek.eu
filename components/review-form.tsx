'use client'

import { useActionState, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { submitReview, type ReviewState } from '@/app/szakemberek/[id]/actions'

const initialState: ReviewState = { status: 'idle', message: '' }

export function ReviewForm({ professionalId }: { professionalId: number }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [visitorId, setVisitorId] = useState('')
  useEffect(() => {
    const id = localStorage.getItem('mesterek-visitor-id') || crypto.randomUUID()
    localStorage.setItem('mesterek-visitor-id', id)
    setVisitorId(id)
  }, [])
  const [state, action, pending] = useActionState(submitReview.bind(null, professionalId), initialState)
  const visibleRating = hovered || rating
  return <form action={action} className="surface flex flex-col gap-5" aria-labelledby="review-form-title">
    <div><p className="font-black text-primary">Saját tapasztalat</p><h2 id="review-form-title" className="mt-1 text-2xl font-black text-foreground">Írjon véleményt</h2><p className="mt-2 leading-relaxed text-muted-foreground">Segítsen másoknak megalapozott döntést hozni.</p></div>
    <input type="hidden" name="visitorId" value={visitorId} />
    <label className="flex flex-col gap-2 font-black text-foreground">Ügyfél neve <span className="font-normal text-muted-foreground">(opcionális)</span><input name="clientName" minLength={2} maxLength={80} autoComplete="name" placeholder="Névtelen" className="min-h-12 rounded-lg border-2 border-border bg-background px-4 font-normal text-foreground" /></label>
    <fieldset className="flex flex-col gap-2"><legend className="font-black text-foreground">Csillagos értékelés</legend><div className="flex w-fit gap-1" onMouseLeave={() => setHovered(0)}>{[1, 2, 3, 4, 5].map((value) => <label key={value} className="cursor-pointer rounded-lg p-1 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-ring"><input className="sr-only" type="radio" name="rating" value={value} required checked={rating === value} onChange={() => setRating(value)} /><Star onMouseEnter={() => setHovered(value)} className={`size-9 ${value <= visibleRating ? 'fill-accent text-accent' : 'text-muted-foreground/45'}`} aria-hidden="true" /><span className="sr-only">{value} csillag</span></label>)}</div><p aria-live="polite" className="min-h-6 text-sm font-bold text-muted-foreground">{rating ? `${rating} / 5 csillag kiválasztva` : 'Válasszon 1–5 csillagot.'}</p></fieldset>
    <label className="flex flex-col gap-2 font-black text-foreground">Vélemény vagy megjegyzés – opciós<textarea name="comment" maxLength={1500} rows={4} placeholder="Röviden leírhatja a tapasztalatát." className="w-full resize-y rounded-lg border-2 border-border bg-background px-4 py-3 font-normal leading-relaxed text-foreground placeholder:text-muted-foreground" /></label>
    <button type="submit" className="btn-primary min-h-14 sm:self-start" disabled={pending}>{pending ? 'Küldés…' : 'Vélemény elküldése'}</button>
    {state.message && <p role="status" className={`font-bold ${state.status === 'error' ? 'text-destructive' : 'text-primary'}`}>{state.message}</p>}
  </form>
}
