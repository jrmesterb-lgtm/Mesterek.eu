'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'

const TURNSTILE_SITE_KEY = '0x4AAAAAAEWbqS_Fl-3Kchu5'
const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
    theme: 'auto'
    size: 'flexible'
    language: string
    'response-field': false
  }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [token, setToken] = useState('')

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'auto',
      size: 'flexible',
      // Force Hungarian regardless of the visitor's browser locale.
      language: 'hu',
      'response-field': false,
      callback: setToken,
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    })
  }, [])

  useEffect(() => {
    if (scriptReady || window.turnstile) renderWidget()
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [renderWidget, scriptReady])

  return (
    <div className="w-full overflow-hidden rounded-xl" aria-label="Biztonsági ellenőrzés">
      <Script
        id={TURNSTILE_SCRIPT_ID}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
    </div>
  )
}
