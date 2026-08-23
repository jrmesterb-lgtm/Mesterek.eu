import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Pool } from 'pg'
import { MUNICIPALITIES } from '../lib/constants'

type SourceProvider = {
  companyName: string
  taxNumber: string
  email: string
  category: string
  categoryName: string
  city: string
  zipCode: string
  address: string
  phone: string
  description: string
  rating: string
  status: string
}

type Provider = SourceProvider & {
  sourceKey: string
  profession: string
}

const townByName = new Map(MUNICIPALITIES.map((place) => [place.name.toLocaleLowerCase('hu-HU'), place]))
const SOURCE_CATEGORY_MAP: Record<string, string> = {
  klima: 'klimas-hutogep',
  villany: 'villanyszerelo',
  asztalos: 'asztalos',
  burkolo: 'burkolo',
  festo: 'festo-mazolo',
  teto: 'tetofedo-acs',
  kert: 'kertesz',
  dugulas: 'dugulaselharitas',
  foldmunka: 'gepi-foldmunka',
  takaritas: 'takaritas',
  haztartasigep: 'haztartasi-gep-szerelo',
  zarszerelo: 'zarszerelo',
  kartevortas: 'rovarirto',
  nyilaszaro: 'redonyos-nyilaszaro',
  lakatos: 'kaputechnika',
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s().-]/g, '').replace(/^06/, '+36')
}

function validateProvider(row: SourceProvider, index: number): Provider {
  const item = index + 1
  const city = townByName.get(row.city?.trim().toLocaleLowerCase('hu-HU'))
  const profession = SOURCE_CATEGORY_MAP[row.category] ? row.categoryName?.trim() : undefined
  const phone = normalizePhone(row.phone ?? '')
  const rating = Number(row.rating)

  if (!row.companyName?.trim()) throw new Error(`${item}. rekord: hiányzó vállalkozásnév.`)
  if (!/^\d{8}-[1-5]-\d{2}$/.test(row.taxNumber ?? '')) throw new Error(`${item}. rekord: érvénytelen adószám.`)
  if (!/^\S+@\S+\.\S+$/.test(row.email ?? '')) throw new Error(`${item}. rekord: érvénytelen e-mail-cím.`)
  if (!/^\+36\d{8,9}$/.test(phone)) throw new Error(`${item}. rekord: érvénytelen magyar telefonszám.`)
  if (!city) throw new Error(`${item}. rekord: ismeretlen település: ${row.city}`)
  if (row.zipCode !== city.zipCode) throw new Error(`${item}. rekord: a település és az irányítószám nem egyezik.`)
  if (!profession) throw new Error(`${item}. rekord: ismeretlen kategória: ${row.category}`)
  if (!row.categoryName?.trim() || !row.address?.trim() || !row.description?.trim()) throw new Error(`${item}. rekord: hiányos nyilvános adatlap.`)
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new Error(`${item}. rekord: érvénytelen értékelés.`)
  if (row.status !== 'active') throw new Error(`${item}. rekord: csak aktív szolgáltató importálható.`)

  const identity = `${row.taxNumber}|${row.companyName}`.toLocaleLowerCase('hu-HU')
  return {
    ...row,
    companyName: row.companyName.trim(),
    email: row.email.trim().toLowerCase(),
    phone,
    profession,
    sourceKey: `bekes-dataset-${createHash('sha256').update(identity).digest('hex').slice(0, 24)}`,
  }
}

async function main() {
  const inputPath = resolve(process.argv.find((argument) => argument.endsWith('.json')) ?? 'data/bekes_county_contractors.json')
  const source = await readFile(inputPath, 'utf8').catch(() => {
    throw new Error(`A megadott JSON forrásfájl nem található: ${inputPath}`)
  })
  const parsed: unknown = JSON.parse(source)
  if (!Array.isArray(parsed)) throw new Error('A JSON gyökerének szolgáltatói tömbnek kell lennie.')

  const records = (parsed as SourceProvider[]).map(validateProvider)
  if (!records.length) throw new Error('A forrásadatbázis üres.')
  if (new Set(records.map((record) => record.sourceKey)).size !== records.length) throw new Error('A forrás duplikált vállalkozásokat tartalmaz.')

  if (process.argv.includes('--dry-run')) {
    console.info(`Ellenőrizve: ${records.length} szolgáltató az átadott JSON-adatbázisból.`)
    return
  }
  if (!process.env.DATABASE_URL) throw new Error('A DATABASE_URL nincs beállítva.')

  const connectionString = process.env.DATABASE_URL.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full')
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of records) {
      await client.query(
        `INSERT INTO professionals
          (name, email, phone, city, profession, description, tax_type, tax_number, billing_name,
           billing_address, zip_code, address, rating, source_key, status, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'company',$7,$8,$9,$10,$11,$12,$13,$14,NOW())
         ON CONFLICT (source_key) DO UPDATE SET
          name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone, city=EXCLUDED.city,
          profession=EXCLUDED.profession, description=EXCLUDED.description, tax_type=EXCLUDED.tax_type,
          tax_number=EXCLUDED.tax_number, billing_name=EXCLUDED.billing_name,
          billing_address=EXCLUDED.billing_address, zip_code=EXCLUDED.zip_code, address=EXCLUDED.address,
          rating=EXCLUDED.rating, status=EXCLUDED.status, updated_at=NOW()`,
        [
          item.companyName, item.email, item.phone, item.city, item.profession, item.description,
          item.taxNumber, item.companyName, `${item.zipCode} ${item.city}, ${item.address}`,
          item.zipCode, item.address, item.rating, item.sourceKey, item.status,
        ],
      )
    }
    await client.query('COMMIT')
    console.info(`Importálva: ${records.length} szolgáltató az átadott JSON-adatbázisból.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
