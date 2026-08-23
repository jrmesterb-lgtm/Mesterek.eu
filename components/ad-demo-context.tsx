'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'mesterek:ad-demo-active'

type AdDemoContextValue = {
  /** Whether the mock native B2B ads render in the search results. */
  isAdDemoActive: boolean
  setAdDemoActive: (active: boolean) => void
  /** False until the stored value has been read, so SSR and first paint agree. */
  hydrated: boolean
}

const AdDemoContext = createContext<AdDemoContextValue | null>(null)

export function AdDemoProvider({ children }: { children: React.ReactNode }) {
  // Always start from the default so the server-rendered markup and the first
  // client paint match; the stored value is applied right after mount.
  const [isAdDemoActive, setIsAdDemoActive] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      setIsAdDemoActive(window.localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      // Private browsing modes can block storage access; the default stands.
    }
    setHydrated(true)
  }, [])

  // Keep other open tabs (e.g. admin in one tab, search in another) in sync.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setIsAdDemoActive(event.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setAdDemoActive = useCallback((active: boolean) => {
    setIsAdDemoActive(active)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(active))
    } catch {
      // Non-persistent fallback: the toggle still works for this page view.
    }
  }, [])

  return <AdDemoContext.Provider value={{ isAdDemoActive, setAdDemoActive, hydrated }}>{children}</AdDemoContext.Provider>
}

export function useAdDemo() {
  const context = useContext(AdDemoContext)
  if (!context) throw new Error('useAdDemo must be used inside an AdDemoProvider.')
  return context
}
