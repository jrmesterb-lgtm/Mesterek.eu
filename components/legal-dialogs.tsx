'use client'

import { FileText, Shield, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const legal = {
  gdpr: { title: 'Adatvédelmi nyilatkozat', icon: Shield, text: ['Adatkezelő: Barna János Mester (Enskild firma), 533 30 Götene, Kvarngatan 6, Svédország. Org.nr / personnummer: 19930124-2930. EU VAT: SE930124293001. Kapcsolat: info@mesterek.eu, +36 30 XXX XXXX.', 'Szakemberek adatai: a regisztráció és az adatlap kezelése során nevet, vállalkozási nevet, szakmát, települést, bemutatkozást, telefonszámot, e-mail-címet, címet, adószámot, előfizetési és számlázási adatokat kezelhetünk. A név, vállalkozási név, szakma, település, bemutatkozás és megadott elérhetőség nyilvánosan megjelenhet; az adózási és fizetési adatok nem nyilvánosak.', 'Látogatók adatai: a weboldal működéséhez szükséges technikai adatokat és a sütibeállításokra vonatkozó választását kezeljük. Névtelen, összesített látogatottsági adatokat a Vercel Analytics segítségével csak előzetes hozzájárulás után mérünk. Az opcionális analitika a cookie-beállításokban bármikor kikapcsolható.', 'Az adatkezelés célja a szakemberkereső működtetése, a profilok közzététele és ellenőrzése, kapcsolattartás, visszaélések megelőzése, a regisztrációval induló 90 napos Kiemelt Mester próbaidőszak és az azt követő havi vagy éves előfizetés kezelése, valamint jogszabályi és számviteli kötelezettségek teljesítése. Jogalapja az érintett hozzájárulása, a szerződés teljesítése, jogi kötelezettség, illetve a szolgáltatás biztonságos működtetéséhez fűződő jogos érdek.', 'Adatfeldolgozók: a Vercel biztosítja a tárhelyet, infrastruktúrát és – hozzájárulás esetén – az analitikát; a Neon az adatbázis-infrastruktúrát; a Stripe a fizetést, előfizetést és kártyaadatokat; a Bokio a svéd könyvelési folyamatot támogatja. A Mesterek nem tárol teljes bankkártyaadatot.', 'Megőrzés: a nyilvános profil adatait az adatlap fennállásáig vagy törlési kérelemig, a szerződéses adatokat a szükséges ideig, a kötelező minimális számviteli bizonylatadatokat pedig 8 évig, a cookie-hozzájárulást legfeljebb egy évig őrizzük. A szükségtelenné vált adatokat töröljük vagy anonimizáljuk.', 'Nemzetközi adattovábbítás esetén az EU/EGT adatvédelmi követelményeit, megfelelőségi határozatot vagy megfelelő szerződéses garanciákat alkalmazunk. A szolgáltatók saját adatvédelmi feltételeik szerint járnak el.', 'Az érintett kérhet hozzáférést, helyesbítést, törlést, korlátozást és adathordozást, tiltakozhat a jogos érdeken alapuló kezelés ellen, illetve bármikor visszavonhatja hozzájárulását. A profil törlése az „Adatlap törlése” oldalon vagy a info@mesterek.eu címen kérhető.', 'Panasz a svéd adatvédelmi hatóságnál, az Integritetsskyddsmyndighetennél (IMY, imy.se), illetve az érintett lakóhelye szerinti felügyeleti hatóságnál tehető. A jelen nyilatkozatot a szolgáltatás vagy a jogszabályok változásakor frissíthetjük.'] },
  aszf: { title: 'Általános Szerződési Feltételek', icon: FileText, text: ['A Mesterek online közvetítő felület szolgáltatója Barna János Mester (Enskild firma), 533 30 Götene, Kvarngatan 6, Svédország, org.nr / personnummer: 19930124-2930, EU VAT: SE930124293001. A szolgáltató nem része a szakember és megrendelő között létrejövő vállalkozási szerződésnek.', 'A szolgáltatás kizárólag vállalkozások részére nyújtott, EU-n belüli B2B szolgáltatás. A jogszabályi feltételek teljesülése és érvényes magyar közösségi adószám esetén a fordított adózás (reverse charge / omvänd skattskyldighet) alkalmazható; az áfa bevallása és megfizetése a vevő feladata Magyarországon.', 'A regisztrációval 90 napos díjmentes Kiemelt Mester próbaidőszak indul. A próbaidőszakhoz érvényes fizetési mód szükséges; az első terhelés csak a 90 nap letelte után történik, havi nettó 4 990 Ft vagy éves nettó 54 990 Ft összegben. A fordított adózás csak a jogszabályi feltételek teljesülése esetén alkalmazható.', 'Ha az előfizető a próbaidőszak vége előtt nem mondja le az előfizetést, az automatikusan fizetős időszakba fordul. A Stripe Billing a választott csomagnak megfelelően kezeli a havi vagy éves terhelést és az elektronikus bizonylatokat. A számlázási és könyvelési folyamat a svéd enskild firma szabályai szerint, Bokio használatával történik.', 'Nincs hűségidő. A Kiemelt Mester előfizetés bármikor, kötbér nélkül lemondható. Lemondás után további díj nem esedékes; már megkezdett fizetett időszakra részleges visszatérítés nincs.', 'A regisztráló felel adatai, különösen közösségi adószáma pontosságáért és szolgáltatása jogszerűségéért. Érvénytelen vagy hiányzó EU-adószám esetén a fordított adózás nem alkalmazható automatikusan.'] },
  impresszum: { title: 'Impresszum', icon: FileText, text: ['Szolgáltatás neve: Mesterek', 'Szolgáltató: Barna János Mester (enskild firma)', 'Ország: Svédország (Sweden)', 'Org.nr / personnummer: 19930124-2930', 'Svéd EU VAT-szám: SE930124293001', 'Hivatalos e-mail: info@mesterek.eu', 'Hivatalos telefon: +36 30 XXX XXXX', 'Jogi és adózási keret: EU-n belüli B2B szolgáltatás; a jogszabályi feltételek teljesülése esetén reverse charge / omvänd skattskyldighet.', 'Számlázás: Stripe Billing; könyvelési folyamat: Bokio, a svéd enskild firma előírásai szerint.'] },
} as const

type LegalKey = keyof typeof legal

export function LegalDialogs({ label = 'Adatvédelem' }: { label?: string } = {}) {
  const [active, setActive] = useState<LegalKey | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!active) return
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active])
  const item = active ? legal[active] : null
  return <>
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" onClick={() => setActive('gdpr')} className="legal-link">{label}</button>
    </div>
    {item && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setActive(null) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="legal-title" className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 text-foreground shadow-2xl md:p-10">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><item.icon className="size-8 text-primary" aria-hidden="true" /><h2 id="legal-title" className="text-balance text-2xl font-black md:text-3xl">{item.title}</h2></div><button ref={closeRef} onClick={() => setActive(null)} className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-border" aria-label="Ablak bezárása"><X /></button></div>
        <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed">{item.text.map((paragraph) => <p key={paragraph}>{paragraph.split(/(info@mesterek\.eu|\+36 30 XXX XXXX)/g).map((part, index) => part === 'info@mesterek.eu' ? <a key={`${part}-${index}`} href="mailto:info@mesterek.eu" className="font-bold underline underline-offset-4">{part}</a> : part === '+36 30 XXX XXXX' ? <a key={`${part}-${index}`} href="tel:+3630XXXXXXX" className="font-bold underline underline-offset-4">{part}</a> : part)}</p>)}</div>
        <button onClick={() => setActive(null)} className="btn-primary mt-8 w-full">Bezárás</button>
      </section>
    </div>}
  </>
}
