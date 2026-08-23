import { Mail, Phone, Wrench } from 'lucide-react'
import Link from 'next/link'
import { CookieSettingsButton } from '@/components/cookie-settings-button'

export function SiteFooter() {
  return <footer className="mt-auto border-t-4 border-accent bg-primary text-primary-foreground">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 text-center md:px-8">
      <div className="flex items-center gap-3 text-2xl font-black"><Wrench aria-hidden="true" />Mesterek.eu</div>
      <p className="max-w-2xl text-lg leading-relaxed">Megbízható helyi szakemberek. Egyszerű keresés, közvetlen kapcsolat.</p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
        <a href="mailto:info@mesterek.eu" className="flex min-h-12 items-center gap-2.5 rounded-lg px-4 font-bold hover:bg-primary-foreground/10"><Mail className="size-6" aria-hidden="true" />info@mesterek.eu</a>
        <a href="tel:+3630XXXXXXX" className="flex min-h-12 items-center gap-2.5 rounded-lg px-4 font-bold hover:bg-primary-foreground/10"><Phone className="size-6" aria-hidden="true" />+36 30 XXX XXXX</a>
      </div>
      <nav aria-label="Jogi információk" className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-1 border-t border-primary-foreground/15 pt-6 sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:justify-center sm:border-t-0 sm:pt-0"><Link href="/impresszum" className="legal-link">Impresszum</Link><Link href="/aszf" className="legal-link">ÁSZF</Link><Link href="/adatvedelem" className="legal-link">Adatvédelmi nyilatkozat</Link><CookieSettingsButton /><Link href="/adatlap-torlese" className="legal-link">Adatlap törlése</Link></nav>
      <p className="max-w-xl text-xs leading-relaxed text-primary-foreground/50">© 2026 Mesterek.eu · Barna Janos Mester (enskild firma), Svédország · közösségi adószám: SE930124293001</p>
    </div>
  </footer>
}
