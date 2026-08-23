'use client'

import { ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const paragraphs = [
  'Adatkezelő: Barna János Mester (enskild firma), 533 30 Götene, Kvarngatan 6, Svédország. Org.nr / personnummer: 19930124-2930, EU VAT: SE930124293001. Kapcsolat és adatvédelmi ügyintézés: info@mesterek.eu.',
  'A regisztráció során megadott kapcsolattartási, szakmai, számlázási, adózási és előfizetési adatokat kizárólag a szakemberkereső működtetése, a profil közzététele és ellenőrzése, a kapcsolattartás, valamint a jogszabályi és számviteli kötelezettségek teljesítése céljából kezeljük.',
  'Adatait biztonságosan, titkosított kapcsolaton keresztül tároljuk. A tárhelyet és az infrastruktúrát a Vercel és a Neon, a fizetéseket és az előfizetéseket a Stripe biztosítja saját, szabványos adatvédelmi feltételei szerint. Teljes bankkártyaadatot nem tárolunk és ahhoz nem férünk hozzá.',
  'Adatait harmadik félnek nem adjuk el, és marketing célból nem továbbítjuk. Adattovábbítás kizárólag a szolgáltatás működéséhez szükséges adatfeldolgozók felé, illetve jogszabályi kötelezettség alapján történik.',
  'Önt megilleti a hozzáférés, a helyesbítés, a törlés, a korlátozás és az adathordozhatóság joga, valamint a hozzájárulás bármikori visszavonásának joga. Adatai törlését bármikor kérheti az info@mesterek.eu címen. Panasszal a svéd Integritetsskyddsmyndigheten (IMY), illetve a lakóhelye szerinti felügyeleti hatósághoz fordulhat.',
]

export function GdprConsentDialog({ label = 'Adatkezelési Tájékoztatót' }: { label?: string } = {}) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return <>
    <button type="button" onClick={() => setOpen(true)} className="font-bold text-primary underline underline-offset-4">{label}</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="gdpr-title" className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 text-foreground shadow-2xl md:p-10">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><ShieldCheck className="size-8 text-primary" aria-hidden="true" /><h2 id="gdpr-title" className="text-balance text-2xl font-black md:text-3xl">Adatkezelési Tájékoztató</h2></div><button ref={closeRef} onClick={() => setOpen(false)} className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-border" aria-label="Ablak bezárása"><X /></button></div>
        <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed">{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph.split(/(info@mesterek\.eu)/g).map((part, index) => part === 'info@mesterek.eu' ? <a key={`${part}-${index}`} href="mailto:info@mesterek.eu" className="font-bold underline underline-offset-4">{part}</a> : part)}</p>)}</div>
        <button onClick={() => setOpen(false)} className="btn-primary mt-8 w-full">Bezárás</button>
      </section>
    </div>}
  </>
}
