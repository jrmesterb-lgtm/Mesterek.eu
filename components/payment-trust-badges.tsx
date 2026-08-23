import { ExternalLink, LockKeyhole } from 'lucide-react'

const paymentBrands = [
  { name: 'Visa', src: '/payment/visa-official.svg', className: 'h-7 w-auto' },
  { name: 'Mastercard', src: '/payment/mastercard-wordmark.svg', className: 'h-10 w-auto' },
  { name: 'Stripe', src: '/payment/stripe-official.svg', className: 'h-8 w-auto' },
]

export function PaymentTrustBadges() {
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-primary/35 bg-secondary p-4 shadow-sm sm:p-5" aria-label="Biztonságos Stripe fizetés">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
          <LockKeyhole className="size-5" strokeWidth={2.5} />
        </span>
        <p className="text-sm font-bold leading-relaxed text-foreground sm:text-base">
          Biztonságos, titkosított fizetés. A bankkártyás fizetést a{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Stripe
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>{' '}
          biztosítja.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Elfogadott kártyák és fizetési szolgáltató</p>
        <div className="flex max-w-full flex-wrap items-center gap-2" aria-label="Visa, Mastercard és Stripe">
          {paymentBrands.map((brand) => (
            <span key={brand.name} className="flex h-12 max-w-full items-center justify-center rounded-xl border border-border bg-card px-3 shadow-sm sm:h-14 sm:px-4">
              <img src={brand.src} alt={`${brand.name} logó`} width={96} height={36} className={`${brand.className} max-w-full object-contain`} />
            </span>
          ))}
        </div>
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">A kártyaadatok közvetlenül a Stripe biztonságos fizetési oldalán adhatók meg.</p>
      </div>
    </aside>
  )
}
