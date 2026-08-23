'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Copy } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const REFERRAL_LINK = 'mesterek.eu/csatlakozas?ref=partner'

const DETAILS_TRIGGER_CLASS =
  'rounded-sm text-sm font-semibold underline underline-offset-4 hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900'

export function ReferralBanner({
  variant = 'public',
  onGiftClick,
}: {
  variant?: 'public' | 'dashboard'
  /** When provided, the banner actions open the gift unboxing modal instead of the inline conditions dialog. */
  onGiftClick?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${REFERRAL_LINK}`)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); still show feedback.
    }
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    onGiftClick?.()
  }

  const isDashboard = variant === 'dashboard'

  return (
    <div className="w-full border-b border-amber-300 bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="gift-wiggle shrink-0 text-3xl leading-none sm:text-4xl" aria-hidden="true">🎁</span>
          <p className="text-left text-sm font-bold leading-tight">
            {isDashboard
              ? 'Ajánlj egy kollégát, és kapj 1 hónap ingyen kiemelést!'
              : 'Szakember vagy? Ajánlj egy kollégát, és kapj 1 hónap ingyen kiemelést!'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {isDashboard && (
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              aria-live="polite"
              className={copied
                ? 'h-8 rounded-full bg-green-600 px-3.5 text-xs font-bold text-white hover:bg-green-600'
                : 'h-8 rounded-full bg-amber-950 px-3.5 text-xs font-bold text-amber-50 hover:bg-amber-900'}
            >
              {copied
                ? <><Check data-icon="inline-start" aria-hidden="true" />Másolva!</>
                : <><Copy data-icon="inline-start" aria-hidden="true" />Link másolása</>}
            </Button>
          )}

          {onGiftClick ? (
            <button type="button" onClick={onGiftClick} className={DETAILS_TRIGGER_CLASS}>
              Részletek
            </button>
          ) : (
          <Dialog>
            <DialogTrigger render={<button type="button" className={DETAILS_TRIGGER_CLASS} />}>
              Részletek
            </DialogTrigger>
            <DialogContent className="border border-border bg-background opacity-100 shadow-2xl backdrop-blur-none">
              <DialogHeader>
                <DialogTitle className="text-lg font-black">Az ajánlóprogram feltételei</DialogTitle>
                <DialogDescription className="text-pretty text-base leading-relaxed text-foreground/80">
                  A visszaélések és a fiktív profilok elkerülése érdekében az 1 hónapos ingyenes kiemelést akkor
                  írjuk jóvá a fiókodban, ha a meghívott kollégád a linkeden keresztül sikeresen regisztrál, ÉS
                  megvásárolja a Kiemelt Szakember előfizetést (vagyis aktív, fizetős taggá válik). Köszönjük, hogy
                  te is hozzájárulsz a megbízható szakemberek közösségének építéséhez!
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button className="font-bold" />}>Értem</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          {!isDashboard && (
            <Button
              size="sm"
              className="h-8 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              render={<Link href="/regisztracio" />}
            >
              Regisztrálok
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
