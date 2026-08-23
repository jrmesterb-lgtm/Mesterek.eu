'use client'

import { useEffect, useState } from 'react'
import { ReferralCard } from '@/components/referral-card'
import { ReferralGiftModal } from '@/components/referral-gift-modal'

/**
 * Owns the shared open state between the sidebar referral card and the gift
 * unboxing modal. The dashboard page is a server component, so the state has to
 * live in a client boundary that renders both pieces.
 *
 * The global yellow ReferralBanner is deliberately NOT rendered on the
 * dashboard: this card already carries the same offer, so the banner would be
 * redundant and eat vertical space.
 */
export function DashboardReferral({ referralCode }: { referralCode: string }) {
  const [giftOpen, setGiftOpen] = useState(false)

  // Auto-open shortly after mount so the dashboard paints first.
  useEffect(() => {
    const timer = setTimeout(() => setGiftOpen(true), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <ReferralCard referralCode={referralCode} onGiftClick={() => setGiftOpen(true)} />
      <ReferralGiftModal referralCode={referralCode} open={giftOpen} onOpenChange={setGiftOpen} />
    </>
  )
}
