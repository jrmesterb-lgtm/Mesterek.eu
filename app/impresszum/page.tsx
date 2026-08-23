import Link from 'next/link'
import { Building2, Mail, MapPin, Phone, ReceiptText, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

export const metadata = {
  title: 'Impresszum',
  description: 'A Mesterek szolgáltatójának azonosító és kapcsolattartási adatai.',
}

// Az üzemeltető változó adatai itt, egy helyen szerkeszthetők.
const operator = {
  name: 'Barna János Mester (Enskild firma)',
  businessAddress: 'Kvarngatan 6, 533 30 Götene, Svédország',
  registrationNumber: '19930124-2930',
  vatNumber: 'SE930124293001',
  email: 'info@mesterek.eu',
  phone: '+36 30 123 4567',
} as const

const details = [
  { label: 'Szolgáltató / tulajdonos neve', value: operator.name, icon: Building2 },
  { label: 'Hivatalos bejegyzett cím', value: operator.businessAddress, icon: MapPin },
  { label: 'Org.nr / personnummer', value: operator.registrationNumber, icon: ReceiptText },
  { label: 'Svéd EU VAT-szám', value: operator.vatNumber, icon: ReceiptText },
] as const

export default function ImprintPage() {
  return <AppShell><div className="page-wrap"><article className="relative mx-auto w-full max-w-4xl rounded-2xl border-2 border-border bg-card p-6 pt-20 shadow-sm md:p-10 md:pt-20">
    <Link href="/" className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-xl border-2 border-border bg-background text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-4" aria-label="Impresszum bezárása és vissza a kezdőlapra"><X className="size-6" aria-hidden="true" /></Link>
    <p className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">Szolgáltatói adatok</p>
    <h1 className="mt-2 text-balance text-4xl font-black tracking-tight text-primary md:text-5xl">Impresszum</h1>
    <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">A Mesterek weboldal üzemeltetőjének azonosító és kapcsolattartási adatai.</p>

    <dl className="mt-10 grid gap-4 md:grid-cols-2">{details.map((detail) => <div key={detail.label} className="rounded-xl border-2 border-border bg-background p-5"><div className="flex items-start gap-4"><detail.icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><div><dt className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{detail.label}</dt><dd className="mt-2 text-lg font-bold leading-relaxed text-foreground">{detail.value}</dd></div></div></div>)}</dl>

    <section className="mt-8 rounded-xl bg-secondary p-6 text-secondary-foreground" aria-labelledby="contact-title"><h2 id="contact-title" className="text-xl font-black text-primary">Kapcsolat</h2><div className="mt-4 flex flex-col gap-3"><a className="flex min-h-11 items-center gap-3 font-bold underline-offset-4 hover:underline" href={`mailto:${operator.email}`}><Mail className="size-5" aria-hidden="true" />{operator.email}</a><a className="flex min-h-11 items-center gap-3 font-bold underline-offset-4 hover:underline" href={`tel:${operator.phone.replace(/\s/g, '')}`}><Phone className="size-5" aria-hidden="true" />{operator.phone}</a></div></section>

    <section className="mt-8 flex flex-col gap-3 text-base leading-relaxed md:text-lg" aria-labelledby="service-title"><h2 id="service-title" className="text-2xl font-black text-primary">A szolgáltatás adatai</h2><p>Szolgáltatás neve és webhely: Mesterek · mesterek.eu</p><p>Tevékenység: online szakemberkereső és szakember-adatlap szolgáltatás (SNI kód: 73.120).</p><p><strong>Webtárhely-szolgáltató:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.</p><p>Számlázás és fizetés: Stripe Billing. A könyvelési folyamat a Bokio használatával, a svéd egyéni vállalkozásokra (enskild firma) vonatkozó szabályok szerint történik.</p><p>Adózási keret: EU-n belüli B2B szolgáltatás; érvényes magyar közösségi adószám esetén fordított adózás (reverse charge) alkalmazható.</p></section>

  </article></div></AppShell>
}
