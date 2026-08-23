'use client'

import Link from 'next/link'
import { CircleHelp, LogIn, Menu, Search, ShieldCheck, UserRound, UserPlus, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { NativeShareButton } from '@/components/native-share-button'
import { AnimatedLogoMark } from '@/components/animated-logo-mark'

const links = [
  { href: '/kereses', label: 'Szakember keresése', icon: Search },
  { href: '/kategoriak', label: 'Kategóriák', icon: Wrench },
  { href: '/regisztracio', label: 'Szakember-regisztráció', icon: UserPlus },
  { href: '/segitseg', label: 'GYIK / Segítség', icon: CircleHelp },
]

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com/profile.php?id=61593239589209', src: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/facebook/default.svg' },
  { label: 'Instagram', href: 'https://instagram.com/accounts/edit', src: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/instagram/default.svg' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@mesterek.eu', src: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/tiktok/default.svg' },
]

function SocialLinks() {
  return <div className="flex items-center gap-1" aria-label="Közösségi média">{socialLinks.map(({ label, href, src }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 shadow-[0_5px_14px_rgb(18_32_51/0.16)] transition-[transform,background-color] active:scale-95 hover:bg-primary-foreground/20 focus-visible:outline-4 sm:size-11 sm:rounded-full sm:shadow-none" aria-label={`${label} megnyitása új lapon`}><img src={src} alt="" width="20" height="20" className="size-4 object-contain sm:size-5" /></a>)}</div>
}

export function SiteHeader({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [open, setOpen] = useState(false)
  const accountHref = isAuthenticated ? '/dashboard' : '/belepes'
  const accountLabel = isAuthenticated ? 'Fiókom' : 'Belépés'
  const AccountIcon = isAuthenticated ? UserRound : LogIn
  return (
    <header className="border-b-4 border-accent bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="flex min-h-14 shrink-0 items-center gap-2 rounded-lg font-black text-xl leading-none text-primary-foreground focus-visible:outline-4 focus-visible:outline-offset-4 sm:gap-3 sm:text-2xl md:text-3xl" aria-label="Mesterek kezdőlap">
          <AnimatedLogoMark />
          <span className="hidden whitespace-nowrap text-primary-foreground min-[430px]:inline">Mesterek</span>
        </Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Fő navigáció">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-12 items-center gap-1.5 rounded-lg px-2 text-sm font-bold hover:bg-primary-foreground/10 focus-visible:outline-4 xl:px-3 xl:text-base"><Icon className="size-5" aria-hidden="true" />{label}</Link>)}
          <Link href="/admin" className="flex min-h-12 items-center gap-1.5 rounded-lg px-2 text-sm font-bold hover:bg-primary-foreground/10 xl:px-3 xl:text-base"><ShieldCheck className="size-5" aria-hidden="true" />Admin</Link>
          <NativeShareButton compact />
          <SocialLinks />
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 xl:hidden">
          <NativeShareButton iconOnly />
          <SocialLinks />
          <button type="button" onClick={() => setOpen(!open)} className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary-foreground/70 bg-primary-foreground/10 shadow-[0_5px_16px_rgb(18_32_51/0.2)] transition-transform active:scale-95" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" className="mx-3 mb-3 flex flex-col gap-4 rounded-3xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-4 shadow-[0_12px_32px_rgb(18_32_51/0.22)] xl:hidden" aria-label="Mobil navigáció">
          <Link href={accountHref} onClick={() => setOpen(false)} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-lg font-black text-accent-foreground shadow-sm transition hover:bg-accent/90 focus-visible:outline-4 focus-visible:outline-offset-2">
            <AccountIcon className="size-5" aria-hidden="true" />{accountLabel}
          </Link>
          <div className="flex flex-col gap-2 border-t border-primary-foreground/20 pt-4">
            {links.map(({ href, label }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="min-h-12 rounded-2xl bg-primary-foreground/10 px-4 py-3 text-lg font-bold transition-[transform,background-color] active:scale-[0.98]">{label}</Link>)}
            <Link href="/admin" onClick={() => setOpen(false)} className="min-h-12 rounded-lg px-4 py-3 text-lg font-bold">Admin</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
