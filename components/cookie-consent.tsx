'use client'

import { Analytics } from '@vercel/analytics/next'
import { Cookie, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const CONSENT_STORAGE_KEY = 'mesterek_cookie_consent'
const LEGACY_CONSENT_COOKIE = 'mesterek_cookie_consent'
const CONSENT_VERSION = '1'
const COOKIE_SETTINGS_EVENT = 'mesterek:cookie-settings'
const CONSENT_CHANGE_EVENT = 'mesterek:consent-change'

type Consent = { version: string; analytics: boolean }

function parseConsent(value: string | null): Consent | null {
  if (!value) return null
  try {
    const consent = JSON.parse(value) as Consent
    return consent.version === CONSENT_VERSION ? consent : null
  } catch {
    return null
  }
}

function readConsent(): Consent | null {
  try {
    const stored = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
    if (stored) return stored

    const legacyValue = document.cookie.split('; ').find((row) => row.startsWith(`${LEGACY_CONSENT_COOKIE}=`))?.split('=')[1]
    const legacyConsent = parseConsent(legacyValue ? decodeURIComponent(legacyValue) : null)
    if (legacyConsent) window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(legacyConsent))
    return legacyConsent
  } catch {
    return null
  }
}

function storeConsent(analytics: boolean) {
  const consent: Consent = { version: CONSENT_VERSION, analytics }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // The choice remains active for this page when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: { analytics } }))
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}

export function CookieConsent() {
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const settingsTitleRef = useRef<HTMLHeadingElement>(null)
  const bannerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const saved = readConsent()
    setAnalytics(saved?.analytics ?? false)
    setVisible(!saved)
    setReady(true)

    const openSettings = () => {
      setAnalytics(readConsent()?.analytics ?? false)
      setVisible(false)
      setSettingsOpen(true)
    }
    const updateConsent = (event: Event) => setAnalytics((event as CustomEvent<{ analytics: boolean }>).detail.analytics)
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings)
    window.addEventListener(CONSENT_CHANGE_EVENT, updateConsent)
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings)
      window.removeEventListener(CONSENT_CHANGE_EVENT, updateConsent)
    }
  }, [])

  useEffect(() => {
    const publishHeight = () => {
      const height = visible ? (bannerRef.current?.getBoundingClientRect().height ?? 0) : 0
      window.dispatchEvent(new CustomEvent('mesterek:cookie-banner-height', { detail: { height } }))
    }
    publishHeight()
    if (!visible || !bannerRef.current) return
    const observer = new ResizeObserver(publishHeight)
    observer.observe(bannerRef.current)
    return () => {
      observer.disconnect()
      window.dispatchEvent(new CustomEvent('mesterek:cookie-banner-height', { detail: { height: 0 } }))
    }
  }, [visible])

  useEffect(() => {
    if (!settingsOpen) return
    settingsTitleRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [settingsOpen])

  const save = (analyticsEnabled: boolean) => {
    storeConsent(analyticsEnabled)
    setAnalytics(analyticsEnabled)
    setVisible(false)
    setSettingsOpen(false)
  }

  if (!ready) return null

  return <>
    {process.env.NODE_ENV === 'production' && analytics && <Analytics />}

    {visible && <section ref={bannerRef} aria-label="Cookie hozzájárulás" className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-accent bg-primary text-primary-foreground shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex max-w-3xl items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Cookie aria-hidden="true" /></div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black">Az Ön adatvédelme fontos számunkra</h2>
            <p className="leading-relaxed text-primary-foreground/85">Szükséges sütiket használunk az oldal működéséhez. Az opcionális, névtelen látogatottsági mérést csak az Ön hozzájárulásával kapcsoljuk be. Döntését később bármikor módosíthatja.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => { setAnalytics(false); setVisible(false); setSettingsOpen(true) }} className="min-h-12 rounded-lg border-2 border-primary-foreground px-5 font-black hover:bg-primary-foreground/10">Beállítások</button>
          <button type="button" onClick={() => save(true)} className="min-h-12 rounded-lg bg-accent px-5 font-black text-accent-foreground hover:brightness-95">Elfogadom</button>
        </div>
      </div>
    </section>}

    {settingsOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 text-foreground shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><Cookie className="size-8 text-primary" aria-hidden="true" /><h2 ref={settingsTitleRef} tabIndex={-1} id="cookie-settings-title" className="text-balance text-2xl font-black outline-none md:text-3xl">Cookie-beállítások</h2></div>
          <button type="button" onClick={() => setSettingsOpen(false)} className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-border" aria-label="Cookie-beállítások bezárása"><X aria-hidden="true" /></button>
        </div>
        <p className="mt-4 leading-relaxed text-muted-foreground">Az opcionális sütik alapértelmezetten ki vannak kapcsolva. A választás önkéntes, és a weboldal szükséges funkcióit nem befolyásolja.</p>
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border-2 border-border p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-black">Szükséges sütik</h3><p className="mt-1 leading-relaxed text-muted-foreground">A hozzájárulási választás és az adminisztrációs munkamenet biztonságos megőrzéséhez. Ezek nélkül az oldal nem működik megfelelően.</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">Mindig aktív</span></div>
          </div>
          <div className="rounded-xl border-2 border-border p-5">
            <div className="flex items-start justify-between gap-4"><div><label htmlFor="analytics-consent" className="font-black">Névtelen analitika</label><p id="analytics-description" className="mt-1 leading-relaxed text-muted-foreground">A Vercel Analytics összesített adatai segítenek megérteni, hogyan használják a látogatók az oldalt. Csak hozzájárulás után töltődik be.</p></div><input id="analytics-consent" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} aria-describedby="analytics-description" className="mt-1 size-6 accent-primary" /></div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => save(false)} className="min-h-12 rounded-lg border-2 border-primary px-5 font-black text-primary">Csak a szükségeseket</button>
          <button type="button" onClick={() => save(analytics)} className="min-h-12 rounded-lg bg-primary px-5 font-black text-primary-foreground">Beállítások mentése</button>
        </div>
      </section>
    </div>}
  </>
}
