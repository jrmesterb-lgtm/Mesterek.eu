import { Star } from 'lucide-react'

export function RatingSummary({ average, count, inverse = false }: { average: number; count: number; inverse?: boolean }) {
  const label = count ? `${average.toFixed(1)} az 5-ből, ${count} értékelés` : 'Még nincs értékelés'
  return <div className="flex flex-wrap items-center gap-2" aria-label={label}>
    <div className="flex items-center gap-0.5" aria-hidden="true">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`size-5 ${star <= Math.round(average) ? 'fill-accent text-accent' : inverse ? 'text-primary-foreground/35' : 'text-muted-foreground/35'}`} />)}</div>
    {count > 0 ? <p className={`font-black ${inverse ? 'text-primary-foreground' : 'text-foreground'}`}>{average.toFixed(1)} / 5 <span className={`font-bold ${inverse ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>({count} értékelés)</span></p> : <p className={`text-sm font-bold ${inverse ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>Még nincs értékelés</p>}
  </div>
}
