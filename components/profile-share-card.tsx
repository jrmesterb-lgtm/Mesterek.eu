'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Link2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.45-4.92 8.45-9.94Z" />
    </svg>
  )
}

export function ProfileShareCard({ profileUrl }: { profileUrl: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const shareHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileUrl)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); still show feedback.
    }
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Users className="size-6" />
          </span>
          <h3 className="text-xl font-bold text-primary">Oszd meg a profilod!</h3>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Posztold ki az adatlapodat a helyi Facebook csoportokba! Egy profi linkkel több ügyfelet szerezhetsz, mintha csak egy telefonszámot írnál ki.
        </p>

        <p className="w-full truncate rounded-lg bg-muted px-3 py-2 text-sm font-bold text-muted-foreground" title={profileUrl}>
          {profileUrl}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-12 w-full bg-[#1877F2] text-base font-black text-white hover:bg-[#1461ca] sm:flex-1"
            render={<a href={shareHref} target="_blank" rel="noopener noreferrer" />}
          >
            <FacebookGlyph className="size-5" />
            Megosztás Facebookon
          </Button>

          <Button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className={copied
              ? 'h-12 w-full bg-green-600 text-base font-black text-white hover:bg-green-600 sm:flex-1'
              : 'h-12 w-full bg-secondary text-base font-black text-secondary-foreground hover:bg-secondary/70 sm:flex-1'}
          >
            {copied
              ? <><Check data-icon="inline-start" aria-hidden="true" />Link másolva!</>
              : <><Link2 data-icon="inline-start" aria-hidden="true" />Profil link másolása</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
