'use client'

import { useId, useState, useTransition } from 'react'
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react'
import { startFeaturedCheckout } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'

type BillingInterval = 'month' | 'year'

const PLANS: { interval: BillingInterval; title: string; price: string; note: string; badge?: string }[] = [
  { interval: 'month', title: 'Havi előfizetés', price: 'Nettó 4 990 Ft', note: '/ hó' },
  { interval: 'year', title: 'Éves előfizetés', price: 'Nettó 49 990 Ft', note: '/ év', badge: '-16% (2 hónap ajándék!)' },
]

export function SubscriptionCheckoutButtons() {
  const groupId = useId()
  const [selected, setSelected] = useState<BillingInterval>('month')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function startCheckout() {
    setError('')
    startTransition(async () => {
      try {
        const result = await startFeaturedCheckout(selected, crypto.randomUUID())
        if (!result.success) {
          setError(result.message)
          return
        }

        const checkoutUrl = new URL(result.url)
        if (checkoutUrl.protocol !== 'https:' || !checkoutUrl.hostname.endsWith('.stripe.com')) {
          setError('A Stripe fizetési oldal címe érvénytelen.')
          return
        }
        window.location.assign(checkoutUrl.toString())
      } catch {
        setError('A fizetés indítása nem sikerült. Próbálja újra.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Előfizetési csomag" className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isActive = selected === plan.interval
          return (
            <button
              key={plan.interval}
              type="button"
              role="radio"
              aria-checked={isActive}
              id={`${groupId}-${plan.interval}`}
              disabled={isPending}
              onClick={() => setSelected(plan.interval)}
              className={`relative flex flex-col gap-1 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70 ${
                isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 transition-colors ${
                  isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                }`}
              >
                {isActive && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="pr-8 text-sm font-bold text-foreground">{plan.title}</span>
              <span className="text-lg font-extrabold text-foreground">{plan.price}</span>
              <span className="text-xs font-medium text-muted-foreground">{plan.note}</span>
              {plan.badge && (
                <span className="mt-1 inline-block self-start rounded-full bg-green-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-green-800">
                  {plan.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={startCheckout}>
        {isPending ? (
          <>
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
            Átirányítás...
          </>
        ) : (
          <>
            Tovább a fizetéshez
            <ArrowUpRight data-icon="inline-end" />
          </>
        )}
      </Button>

      {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
    </div>
  )
}
