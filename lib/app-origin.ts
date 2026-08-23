import 'server-only'

function normalizeOrigin(value: string | undefined) {
  if (!value) return null
  const candidate = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    return url.origin
  } catch {
    return null
  }
}

export function getAppOrigin() {
  const origin = normalizeOrigin(process.env.BETTER_AUTH_URL)
    ?? normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    ?? normalizeOrigin(process.env.VERCEL_URL)
    ?? normalizeOrigin(process.env.V0_RUNTIME_URL)
    ?? normalizeOrigin('https://mesterek.eu')
  if (origin) return origin
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
  throw new Error('A szolgáltatás nyilvános címe nincs beállítva.')
}
