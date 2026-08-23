'use client'

import { Check, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const shareData = {
  title: 'Mesterek.eu - Szakemberkereső',
  text: 'Találj megbízható szakembert gyorsan és egyszerűen!',
  url: 'https://mesterek.eu',
}

export function NativeShareButton({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 3000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url)
    } catch {
      const input = document.createElement('textarea')
      input.value = shareData.url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
  }

  return (
    <>
      <button type="button" onClick={share} className={iconOnly ? "inline-flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-primary-foreground text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:outline-4" : compact ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-primary-foreground/70 px-3 py-2 text-sm font-black text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:outline-4" : "inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-primary bg-card px-5 py-3 text-lg font-black text-primary shadow-sm transition hover:bg-secondary focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent md:w-auto"} aria-label="Mesterek.eu megosztása">
        <Share2 className={compact || iconOnly ? "size-5" : "size-6"} aria-hidden="true" />
        {!iconOnly && 'Megosztás'}
      </button>
      {copied && <div className="fixed bottom-24 left-1/2 z-50 flex min-h-14 -translate-x-1/2 items-center gap-3 rounded-xl bg-foreground px-5 py-3 font-bold text-background shadow-xl" role="status" aria-live="polite"><Check className="size-6" aria-hidden="true" />Link sikeresen másolva!</div>}
    </>
  )
}
