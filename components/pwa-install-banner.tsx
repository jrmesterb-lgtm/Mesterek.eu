'use client'

import { Download, Share, Smartphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [visible, setVisible] = useState(false)
  const [instructions, setInstructions] = useState(false)
  const [cookieBannerHeight, setCookieBannerHeight] = useState(0)

  useEffect(() => {
    const updateClearance = (event: Event) => {
      setCookieBannerHeight((event as CustomEvent<{ height: number }>).detail.height)
    }
    window.addEventListener('mesterek:cookie-banner-height', updateClearance)
    return () => window.removeEventListener('mesterek:cookie-banner-height', updateClearance)
  }, [])

  useEffect(() => {
    navigator.serviceWorker?.register('/sw.js')
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    if (standalone) return

    setVisible(true)
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setPrompt(null)
      setInstructions(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!prompt) {
      setInstructions(true)
      return
    }
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    setPrompt(null)
  }

  function dismiss() {
    setVisible(false)
    setInstructions(false)
    setPrompt(null)
  }

  if (!visible) return null

  return <>
    <div
      className="fixed right-3 z-30 transition-[bottom] duration-300 sm:right-6"
      style={{ bottom: `calc(${cookieBannerHeight}px + max(0.75rem, env(safe-area-inset-bottom)))` }}
    >
      <div className="relative">
        <Button
          type="button"
          onClick={install}
          aria-label="App letöltése vagy kezdőképernyőhöz adása"
          aria-haspopup={prompt ? undefined : 'dialog'}
          className="group h-auto max-w-64 gap-3 rounded-2xl border-2 border-accent-foreground/25 bg-accent py-3 pl-3 pr-9 text-left text-accent-foreground shadow-2xl transition-all hover:-translate-y-1 hover:bg-accent/90 hover:shadow-xl focus-visible:-translate-y-1 sm:max-w-none sm:pl-4 sm:pr-10"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-all group-hover:scale-105 group-hover:bg-primary/90 group-hover:shadow-xl" aria-hidden="true">
            <Download className="size-5" />
          </span>
          <span className="text-pretty text-sm font-black leading-snug sm:text-base">App letöltése / Kezdőképernyőhöz adás</span>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="App letöltési ajánlat végleges bezárása"
          className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full text-accent-foreground transition-colors hover:bg-accent-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    {instructions && <div className="fixed inset-0 z-50 flex items-end bg-foreground/60 p-4 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstructions(false) }}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl bg-card p-6 text-card-foreground shadow-xl" role="dialog" aria-modal="true" aria-labelledby="install-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-primary">{isIos ? 'iPhone és iPad' : 'Telepítés kézzel'}</p>
            <h2 id="install-title" className="text-2xl font-black">App telepítése</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setInstructions(false)} aria-label="Útmutató bezárása"><X aria-hidden="true" /></Button>
        </div>
        {isIos ? <ol className="flex flex-col gap-4 text-base leading-relaxed">
          <li className="flex gap-3"><Share className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><span><strong>1. Koppintson a Megosztás gombra</strong> a Safari alsó menüjében.</span></li>
          <li className="flex gap-3"><Smartphone className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><span><strong>2. Válassza a Hozzáadás a kezdőképernyőhöz</strong> lehetőséget.</span></li>
        </ol> : <ol className="flex flex-col gap-4 text-base leading-relaxed">
          <li className="flex gap-3"><Download className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><span><strong>1. Nyissa meg a böngésző menüjét</strong>, és keresse a Telepítés lehetőséget.</span></li>
          <li className="flex gap-3"><Smartphone className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><span><strong>2. Erősítse meg a telepítést</strong>, és a Mesterek megjelenik az eszközén.</span></li>
        </ol>}
        <Button type="button" onClick={() => setInstructions(false)}>Értem</Button>
      </section>
    </div>}
  </>
}
