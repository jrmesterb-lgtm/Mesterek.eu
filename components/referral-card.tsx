'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ReferralCard({
  referralCode,
  onGiftClick,
}: {
  referralCode: string
  /** When provided, copying the link also opens the gift unboxing modal. */
  onGiftClick?: () => void
}) {
  const referralLink = `mesterek.eu/csatlakozas?ref=${referralCode}`
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); still show feedback.
    }
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    onGiftClick?.()
  }

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-950">
      <div className="flex items-center gap-2">
        <span className="gift-wiggle shrink-0 text-3xl leading-none" aria-hidden="true">🎁</span>
        <p className="font-bold leading-tight">Ajánlj egy kollégát!</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-yellow-900">
        Oszd meg a linkedet, és ha egy ismerősöd regisztrál, kapsz 1 hónap ingyenes kiemelést!
      </p>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="referral-link" className="sr-only">Ajánlói link</label>
        <input
          id="referral-link"
          readOnly
          value={referralLink}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-yellow-200 bg-white px-2.5 py-1.5 text-xs font-medium text-yellow-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-yellow-500"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCopy}
          aria-live="polite"
          className={copied
            ? 'shrink-0 bg-green-600 text-white hover:bg-green-600'
            : 'shrink-0 bg-yellow-500 text-yellow-950 hover:bg-yellow-400'}
        >
          {copied
            ? <><Check data-icon="inline-start" aria-hidden="true" />Másolva!</>
            : <><Copy data-icon="inline-start" aria-hidden="true" />Másolás</>}
        </Button>
      </div>
    </div>
  )
}
