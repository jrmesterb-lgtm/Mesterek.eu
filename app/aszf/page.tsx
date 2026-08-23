import Link from 'next/link'
import { FileText, ShieldCheck, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

export const metadata = {
  title: 'ÁSZF / Felhasználási feltételek',
  description: 'A Mesterek szakemberkereső szolgáltatás általános szerződési és felhasználási feltételei.',
}

const sections = [
  {
    title: '1. A szolgáltató és a szolgáltatás',
    paragraphs: [
      'A Mesterek online szakemberkereső és megjelenési felület szolgáltatója Barna János Mester (Enskild firma). Hivatalos bejegyzett cím: Kvarngatan 6, 533 30 Götene, Svédország. Org.nr / personnummer: 19930124-2930; EU VAT: SE930124293001; e-mail: info@mesterek.eu.',
      'A Mesterek közvetítő felületet biztosít a szakemberek és az érdeklődők kapcsolatfelvételéhez. A szolgáltató nem válik a szakember és a megrendelő közötti szerződés részesévé, és nem vállal felelősséget a köztük létrejövő megállapodás teljesítéséért.',
    ],
  },
  {
    title: '2. Regisztráció és szakember-adatlap',
    paragraphs: [
      'A fizetős szakember-megjelenés vállalkozások részére nyújtott EU-n belüli B2B szolgáltatás. A regisztráló köteles valós, pontos és naprakész adatokat megadni, valamint jogosultnak kell lennie a vállalkozás képviseletére és az adatlap közzétételére.',
      'A szolgáltató jogosult a jogellenes, megtévesztő, hiányos, mások jogait sértő vagy a platform biztonságát veszélyeztető tartalmat elutasítani, felfüggeszteni vagy eltávolítani.',
    ],
  },
  {
    title: '3. Előfizetési díj és számlázás',
    paragraphs: [
      'A regisztrációval a Kiemelt Mester előfizetés 60 napos díjmentes próbaidőszaka indul. A próbaidőszak megkezdéséhez érvényes fizetési mód szükséges; az első terhelés a 60 nap letelte után esedékes. Ezt követően a Stripe Billing a regisztrációkor választott havi nettó 4 990 Ft-os vagy éves nettó 49 990 Ft-os díjat automatikusan terheli, és kezeli az elektronikus fizetési bizonylatokat.',
      'A biztonságos online fizetés feldolgozója a Stripe, Inc. A Mesterek.eu a nyers bankkártyaszámokat nem tárolja, azokhoz nem fér hozzá; a kártyaadatokat közvetlenül a Stripe kezeli. A Stripe adatkezeléséről a Stripe adatvédelmi tájékoztatójában olvashat.',
      'A próbaidőszak alatt az előfizetés bármikor, kötbér nélkül lemondható. Ha az előfizető a 60 nap lejárta előtt lemondja, előfizetési díj nem kerül felszámításra; ellenkező esetben az előfizetés automatikusan fizetős időszakba fordul.',
      'Érvényes magyar közösségi adószám esetén az EU B2B fordított adózás (reverse charge) szabályai alkalmazhatók, 0%-os svéd áfával. A regisztráló felel az adószám és a számlázási adatok helyességéért, valamint a magyarországi áfabevallási kötelezettség teljesítéséért.',
    ],
  },
  {
    title: '4. Lemondás, megszűnés és visszatérítés',
    paragraphs: [
      'Az előfizetés bármikor, indokolás és kötbér nélkül lemondható a szakember-irányítópult Stripe számlázási felületén vagy az info@mesterek.eu címen. A lemondást a következő terhelés előtt kell kezdeményezni; az e-mailben kért lemondás feldolgozását a szolgáltató visszaigazolja.',
      'Lemondás után újabb havi díjat nem terhelünk. A már megkezdett és kifizetett havi időszak végéig a szolgáltatás használható; részleges hónapra arányos visszatérítés nem jár, kivéve, ha kötelező jogszabály másként rendelkezik.',
      'Sikertelen terhelés esetén a szolgáltató a Stripe újrapróbálkozási folyamatát követően korlátozhatja vagy felfüggesztheti az adatlap kiemelt megjelenését. A szakember a fiókját az irányítópulton törölheti; ekkor a személyes és működési adatokat töröljük vagy anonimizáljuk, a jogszabály alapján kötelező minimális számviteli bizonylatadatokat pedig 8 évig megőrizzük.',
    ],
  },
  {
    title: '5. Felelősség',
    paragraphs: [
      'A szakemberek önálló vállalkozóként járnak el. Saját engedélyeikért, képesítésükért, ajánlataikért, munkájuk minőségéért, határidejéért, díjazásáért és az alkalmazandó fogyasztóvédelmi, adózási és szakmai szabályok betartásáért kizárólag ők felelnek.',
      'A Mesterek nem garantálja az adatlapok folyamatos elérhetőségét, az érdeklődések vagy megrendelések számát, illetve a felhasználók által közölt információk pontosságát. A szolgáltató a kötelező jogszabályok által megengedett mértékben nem felel közvetett károkért, elmaradt haszonért vagy a szakember és megrendelő közötti jogvitáért.',
      'A jelen korlátozások nem zárják ki a szándékosan vagy súlyos gondatlansággal okozott kárért, illetve a jogszabály alapján ki nem zárható felelősségét.',
    ],
  },
  {
    title: '6. Irányadó jog és módosítás',
    paragraphs: [
      'A szolgáltató Kvarngatan 6, 533 30 Götene, Svédország címen bejegyzett svéd vállalkozás, ezért a jogviszonyra – az alkalmazandó uniós kötelező szabályok mellett – a svéd jog irányadó. A felek elsőként békés, írásbeli egyeztetésre törekednek; az illetékességet a kötelező uniós és svéd jogszabályok határozzák meg.',
      'A feltételek lényeges módosításáról a szolgáltató megfelelő időben tájékoztatja az előfizetőket. Ha az előfizető a módosítást nem fogadja el, az új feltételek hatálybalépése előtt lemondhatja az előfizetést.',
    ],
  },
] as const

export default function TermsPage() {
  return <AppShell><div className="page-wrap"><article className="relative mx-auto w-full max-w-4xl rounded-2xl border-2 border-border bg-card p-6 pt-20 shadow-sm md:p-10 md:pt-20">
    <Link href="/" className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-xl border-2 border-border bg-background text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-4" aria-label="ÁSZF bezárása és vissza a kezdőlapra"><X className="size-6" aria-hidden="true" /></Link>
    <div className="flex items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="size-8" aria-hidden="true" /></div><div><p className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">Hatályos: 2026. augusztus 18.</p><h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-primary md:text-5xl">ÁSZF / Felhasználási feltételek</h1></div></div>
    <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">A feltételek a Mesterek szakember-adatlap szolgáltatás használatát és előfizetését szabályozzák.</p>
    <div className="mt-10 flex flex-col gap-9">{sections.map((section) => <section key={section.title} aria-labelledby={`section-${section.title[0]}`}><h2 id={`section-${section.title[0]}`} className="text-balance text-2xl font-black text-primary">{section.title}</h2><div className="mt-3 flex flex-col gap-3 text-base leading-relaxed md:text-lg">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph.split(/(info@mesterek\.eu|Stripe adatvédelmi tájékoztatójában)/).map((part, index) => part === 'info@mesterek.eu' ? <a key={`${section.title}-${index}`} href="mailto:info@mesterek.eu" className="font-bold underline underline-offset-4">info@mesterek.eu</a> : part === 'Stripe adatvédelmi tájékoztatójában' ? <a key={`${section.title}-${index}`} href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-4">Stripe adatvédelmi tájékoztatójában<span className="sr-only"> (új lapon nyílik meg)</span></a> : <span key={`${section.title}-${index}`}>{part}</span>)}</p>)}</div></section>)}</div>
    <div className="mt-10 flex items-start gap-3 rounded-xl bg-secondary p-5 text-secondary-foreground"><ShieldCheck className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" /><p className="leading-relaxed"><strong>Kapcsolat és lemondás:</strong> <a href="mailto:info@mesterek.eu" className="font-bold underline underline-offset-4">info@mesterek.eu</a>, <a href="tel:+36301234567" className="font-bold underline underline-offset-4">+36 30 123 4567</a>. A mindenkor hatályos feltételek ezen az oldalon érhetők el.</p></div>
  </article></div></AppShell>
}
