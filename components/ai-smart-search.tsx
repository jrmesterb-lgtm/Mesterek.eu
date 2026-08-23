'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mic, Siren, Sparkles } from 'lucide-react'
import { matchCategoryFromText } from '@/lib/smart-search'

type Status =
  | { kind: 'idle' }
  | { kind: 'listening' }
  | { kind: 'analysing' }
  | { kind: 'matched'; category: string }
  | { kind: 'unmatched' }
  | { kind: 'voice-error'; message: string }

/** Minimal shape of the Web Speech API surface this component relies on. */
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function AiSmartSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [voiceSupported, setVoiceSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const analyseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Grow with the text up to a cap, so long descriptions stay readable without
  // pushing the SOS button off screen. CSS min-height still floors it at 3 lines.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`
  }, [query])

  // Feature-detect on the client only, so SSR and first paint agree.
  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null)
  }, [])

  useEffect(() => () => {
    if (analyseTimer.current) clearTimeout(analyseTimer.current)
    recognitionRef.current?.stop()
  }, [])

  function runAnalysis(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Brief analysing beat so the category hand-off is legible rather than instant.
    setStatus({ kind: 'analysing' })
    if (analyseTimer.current) clearTimeout(analyseTimer.current)
    analyseTimer.current = setTimeout(() => {
      const { category } = matchCategoryFromText(trimmed)
      const params = new URLSearchParams({ q: trimmed })
      if (category) params.set('kategoria', category)
      setStatus(category ? { kind: 'matched', category } : { kind: 'unmatched' })
      router.push(`/kereses?${params.toString()}`)
    }, 900)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    runAnalysis(query)
  }

  // Enter submits, Shift+Enter adds a newline. Never submit mid-IME composition.
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    runAnalysis(query)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setStatus({ kind: 'idle' })
  }

  function startListening() {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setStatus({ kind: 'voice-error', message: 'Ez a böngésző nem támogatja a hangfelismerést. Írja be a problémát.' })
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'hu-HU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) => event.results[i][0].transcript).join(' ').trim()
      if (transcript) {
        setQuery(transcript)
        runAnalysis(transcript)
      }
    }
    recognition.onerror = (event) => {
      const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed'
      setStatus({
        kind: 'voice-error',
        message: denied
          ? 'A mikrofon használatát a böngésző letiltotta. Engedélyezze, vagy írja be a problémát.'
          : 'A hangfelismerés nem sikerült. Próbálja újra, vagy írja be a problémát.',
      })
      recognitionRef.current = null
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setStatus((current) => (current.kind === 'listening' ? { kind: 'idle' } : current))
    }

    recognitionRef.current = recognition
    setStatus({ kind: 'listening' })
    try {
      recognition.start()
    } catch {
      setStatus({ kind: 'voice-error', message: 'A hangfelismerés nem indítható el. Írja be a problémát.' })
      recognitionRef.current = null
    }
  }

  const listening = status.kind === 'listening'
  const analysing = status.kind === 'analysing'

  return (
    <section className="w-full max-w-3xl text-left" aria-labelledby="ai-search-title">
      <h2 id="ai-search-title" className="flex items-center justify-center gap-2 text-center text-sm font-black uppercase tracking-wider text-accent">
        <Sparkles className="size-4" aria-hidden="true" />
        AI okos keresés
      </h2>

      <form
        onSubmit={handleSubmit}
        className="app-card-mobile mt-3 flex flex-col gap-2 border-2 border-accent/70 bg-card p-3 shadow-lg focus-within:border-accent md:rounded-2xl md:p-4"
      >
        <label htmlFor="ai-search-input" className="sr-only">Írja le a problémát</label>
        <textarea
          id="ai-search-input"
          ref={textareaRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Írd le vagy mondd el a problémát (pl. nem fűt a kazán, vagy csőtörés van)..."
          className="min-h-[5.5rem] w-full resize-none bg-transparent px-1 text-base font-semibold leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none md:min-h-24 md:text-lg"
          autoComplete="off"
          enterKeyHint="search"
        />

        {/* Actions docked bottom-right so the prompt text gets the full width. */}
        <div className="flex items-center justify-end gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              aria-pressed={listening}
              aria-label={listening ? 'Hangfelvétel leállítása' : 'Probléma elmondása hanggal'}
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-[transform,background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${listening ? 'mic-listening' : 'border-2 border-primary/25 bg-secondary text-primary shadow-[0_1px_3px_rgb(18_61_112/0.12)] hover:scale-[1.03] hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_4px_12px_rgb(18_61_112/0.28)]'}`}
            >
              <Mic className="size-5" aria-hidden="true" />
            </button>
          )}

          <button
            type="submit"
            disabled={!query.trim() || analysing}
            aria-label="Keresés indítása"
            className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-bright px-5 text-base font-black text-primary-foreground shadow-[0_2px_6px_rgb(18_61_112/0.28),0_8px_20px_rgb(29_99_176/0.32)] transition-[transform,box-shadow,filter] hover:scale-[1.03] hover:shadow-[0_3px_8px_rgb(18_61_112/0.34),0_12px_28px_rgb(29_99_176/0.42)] active:scale-[0.98] disabled:cursor-not-allowed disabled:saturate-[0.55] disabled:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {analysing ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
            Keresés
          </button>
        </div>
      </form>

      {/* Single live region so screen readers hear each state change once. */}
      <div aria-live="polite" className="mt-2 min-h-6 text-center text-sm font-bold">
        {listening && (
          <p className="flex items-center justify-center gap-2 text-primary-foreground">
            <span className="sos-dot bg-sos" aria-hidden="true" />
            Hallgatom… mondja el a problémát!
          </p>
        )}
        {analysing && (
          <p className="flex items-center justify-center gap-2 text-accent">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            AI elemzés és kategória keresése...
          </p>
        )}
        {status.kind === 'matched' && <p className="text-accent">Felismert kategória: {status.category}</p>}
        {status.kind === 'unmatched' && <p className="text-primary-foreground/80">Nem találtunk kategóriát – megnyitjuk a részletes keresést.</p>}
        {status.kind === 'voice-error' && <p className="text-primary-foreground/90">{status.message}</p>}
      </div>

      <div className="mt-3 flex justify-center">
        <Link
          href="/kereses?sos=1"
          className="sos-badge min-h-11 px-5 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="SOS gyorsszolgálat, éjjel-nappal elérhető szakemberek"
        >
          <span className="sos-dot" aria-hidden="true" />
          <Siren className="size-4" aria-hidden="true" />
          SOS 0-24
        </Link>
      </div>
    </section>
  )
}
