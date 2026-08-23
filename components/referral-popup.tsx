'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ReferralPopup({
  referralCode,
  open,
  onOpenChange,
}: {
  referralCode: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
    timeoutRef.current = setTimeout(() => setCopied(false), 2400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="gap-0 overflow-hidden border-0 bg-card p-0 opacity-100 shadow-2xl backdrop-blur-none sm:max-w-md"
      >
        <div className="flex flex-col items-center gap-4 bg-accent px-6 pt-8 pb-7 text-center text-accent-foreground">
          <span className="gift-wiggle text-6xl leading-none" aria-hidden="true">🎁</span>
          <DialogTitle className="text-balance text-2xl font-extrabold leading-tight">
            Szerezz +1 hónap ingyenes előfizetést!
          </DialogTitle>
        </div>

        <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
          <DialogDescription className="text-pretty text-center text-base leading-relaxed text-muted-foreground">
            Hívd meg egy szakmabeli ismerősödet! Ha az alábbi linkeden keresztül regisztrál, és a 60 napos próbaidő
            után aktív, fizető Kiemelt Mester marad, mindketten kaptok +1 hónap ingyenes előfizetést automatikusan
            jóváírva!
          </DialogDescription>

          <p className="truncate rounded-xl border border-border bg-muted px-3 py-2.5 text-center text-sm font-semibold text-foreground">
            {referralLink}
          </p>

          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              size="lg"
              onClick={handleCopy}
              aria-live="polite"
              className={copied
                ? 'h-14 w-full bg-green-600 text-lg font-black text-white hover:bg-green-600'
                : 'h-14 w-full text-lg font-black'}
            >
              {copied
                ? <><Check data-icon="inline-start" className="size-6" aria-hidden="true" />Link másolva!</>
                : <><Copy data-icon="inline-start" className="size-6" aria-hidden="true" />Kolléga meghívása</>}
            </Button>

            <DialogClose
              render={
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                />
              }
            >
              Később
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
