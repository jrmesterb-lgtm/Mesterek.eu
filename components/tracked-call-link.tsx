'use client'

import { Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  contractorId: number
  phone: string
  label: string
  displayPhone?: string
  featured?: boolean
}

export function TrackedCallLink({ contractorId, phone, label, displayPhone, featured = false }: Props) {
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

  return (
    <a
      href={`tel:${phone}`}
      onClick={trackPhoneClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
        featured
          ? 'min-h-20 w-full bg-accent px-5 py-4 text-center text-xl text-accent-foreground shadow-lg transition hover:brightness-95 sm:text-2xl'
          : 'btn-outline min-h-12 shrink-0',
      )}
    >
      <Phone className={featured ? 'size-8' : undefined} strokeWidth={featured ? 2.5 : undefined} aria-hidden="true" />
      <span>{label}{displayPhone && <span className="mt-1 block text-sm">{displayPhone}</span>}</span>
    </a>
  )
}
