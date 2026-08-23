'use client'

import { Eye, Phone } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  contractorId: number
  phone: string
  label: string
  displayPhone?: string
  featured?: boolean
  maskUntilReveal?: boolean
  revealLabel?: string
  compact?: boolean
}

// Reveal only the country + 2-digit operator code, mask the subscriber digits to deter scraping bots.
function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('36') && digits.length >= 4) {
    return `+36 ${digits.slice(2, 4)} *** ****`
  }
  return `${value.slice(0, 4)}${value.slice(4).replace(/\d/g, '*')}`
}

export function TrackedCallLink({ contractorId, phone, label, displayPhone, featured = false, maskUntilReveal = false, revealLabel = 'Szám mutatása', compact = false }: Props) {
  const [revealed, setRevealed] = useState(false)
  const masked = maskUntilReveal && !revealed

  function trackPhoneClick() {
    const visitorId = localStorage.getItem('mesterek-visitor-id') || crypto.randomUUID()
    localStorage.setItem('mesterek-visitor-id', visitorId)
    const body = JSON.stringify({ contractorId, interactionType: 'phone_click', visitorId })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/leads', new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (masked) {
      // First tap only reveals the number; it does not dial yet.
      event.preventDefault()
      setRevealed(true)
      return
    }
    trackPhoneClick()
  }

  const mainLabel = masked ? revealLabel : label
  const shownPhone = displayPhone ? (masked ? maskPhone(displayPhone) : displayPhone) : undefined
  const Icon = masked ? Eye : Phone

  return (
    <a
      href={`tel:${phone}`}
      onClick={handleClick}
      aria-label={masked ? 'Telefonszám megjelenítése' : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
        featured && compact
          ? 'h-14 w-full rounded-full bg-amber-400 px-5 text-center text-base text-amber-950 shadow-md transition hover:bg-amber-300 sm:text-lg'
          : featured
            ? 'min-h-20 w-full bg-accent px-5 py-4 text-center text-xl text-accent-foreground shadow-lg transition hover:brightness-95 sm:text-2xl'
            : 'btn-outline min-h-12 shrink-0',
      )}
    >
      <Icon className={featured && !compact ? 'size-8' : 'size-5'} strokeWidth={featured ? 2.5 : undefined} aria-hidden="true" />
      <span>{mainLabel}{shownPhone && <span className={compact ? 'ml-2 text-sm font-bold opacity-90' : 'mt-1 block text-sm'}>{shownPhone}</span>}</span>
    </a>
  )
}
