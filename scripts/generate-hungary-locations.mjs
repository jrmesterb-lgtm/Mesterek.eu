import { writeFile } from 'node:fs/promises'

const source = 'https://raw.githubusercontent.com/tamas-ferenci/IrszHnk/master/IrszHnk.json'
const response = await fetch(source)
if (!response.ok) throw new Error(`Location source returned ${response.status}`)
const rows = await response.json()
const locations = new Map()
for (const row of rows) {
  const rawCounty = String(row['Vármegye.megnevezése'] ?? '').trim()
  const rawCity = String(row['Helység.megnevezése'] ?? '').trim()
  const zipCode = String(row.IRSZ ?? '').padStart(4, '0')
  const county = rawCounty === 'főváros' ? 'Budapest' : rawCounty
  const city = rawCounty === 'főváros' ? 'Budapest' : rawCity
  if (!county || !city || !/^\d{4}$/.test(zipCode)) continue
  const key = `${county}\u0000${city}`
  const existing = locations.get(key)
  if (!existing || zipCode.localeCompare(existing.zipCode) < 0) locations.set(key, { county, city, zipCode })
}
const sorted = [...locations.values()].sort((a, b) => a.county.localeCompare(b.county, 'hu') || a.city.localeCompare(b.city, 'hu'))
const header = `// Generated from IrszHnk (Magyar Posta + KSH), ${new Date().toISOString().slice(0, 10)}.\n// Do not edit manually; run scripts/generate-hungary-locations.mjs.\n`
await writeFile(new URL('../lib/hungary-location-data.ts', import.meta.url), `${header}export const HUNGARY_LOCATION_DATA = ${JSON.stringify(sorted)} as const\n`)
console.log(`Generated ${sorted.length} Hungarian settlements.`)
