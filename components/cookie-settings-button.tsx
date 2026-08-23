'use client'

import { openCookieSettings } from '@/components/cookie-consent'

export function CookieSettingsButton() {
  return <button type="button" onClick={openCookieSettings} className="legal-link">Cookie-beállítások</button>
}
