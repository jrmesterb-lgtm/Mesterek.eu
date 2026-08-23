import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MailCheck,
  PhoneCall,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AvailabilityToggle } from '@/components/availability-toggle'
import { DashboardProfileForm } from '@/components/dashboard-profile-form'
import { DeleteAccountForm } from '@/components/delete-account-form'
import { PaymentTrustBadges } from '@/components/payment-trust-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getAuthenticatedContractorDashboard } from '@/lib/contractor-dashboard'
import { hasActivePremium } from '@/lib/premium'
import { deletePortfolioImage, logoutDashboard, openBillingPortal, startFeaturedCheckout, uploadPortfolioImage } from './actions'

export const metadata = { title: 'Szakember-irányítópult', robots: { index: false, follow: false } }

const NAVIGATION = [
  { href: '#attekintes', label: 'Áttekintés', icon: LayoutDashboard },
  { href: '#adatlapom', label: 'Adatlapom', icon: UserRound },
  { href: '#elofizetes', label: 'Előfizetés', icon: CreditCard },
  { href: '#biztonsag', label: 'Biztonság', icon: ShieldCheck },
]

const STATUS_LABELS = {
  APPROVED: { label: 'Aktív adatlap', description: 'Profilja látható a keresőben.' },
  PENDING_REVIEW: { label: 'Ellenőrzés alatt', description: 'Munkatársaink ellenőrzik a módosításokat.' },
  REJECTED: { label: 'Javítás szükséges', description: 'Az adatlap jelenleg nem jelenik meg.' },
} as const

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Piszkozat', open: 'Fizetésre vár', paid: 'Fizetve', void: 'Érvénytelenítve', uncollectible: 'Behajthatatlan', unknown: 'Ismeretlen',
}

function daysRemaining(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000))
}

export default async function DashboardPage() {
  const dashboard = await getAuthenticatedContractorDashboard().catch(() => null)
  if (!dashboard) redirect('/regisztracio')

  const profile = dashboard.professional
  const featured = hasActivePremium(profile)
  const status = STATUS_LABELS[profile.status]
  const trialEnd = profile.stripeTrialEnd
  const remainingTrialDays = trialEnd ? daysRemaining(trialEnd) : 0
  const isTrial = profile.stripeSubscriptionStatus === 'trialing' && remainingTrialDays > 0
  const hasPaymentProblem = profile.stripeSubscriptionStatus === 'past_due' || profile.stripeSubscriptionStatus === 'unpaid'
  const completenessFields = [profile.name, profile.billingName, profile.email, profile.phone, profile.profession, profile.description, profile.city, profile.isEmergency247 || profile.website]
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100)
  const lastLogin = profile.lastLoginAt?.toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) ?? 'Nincs adat'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col lg:flex-row">
        <aside className="bg-primary text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col">
          <div className="flex items-center justify-between gap-4 px-5 py-5 lg:flex-col lg:items-start lg:px-7 lg:py-8">
            <Link href="/" className="text-xl font-black tracking-tight">Mesterek</Link>
            <Badge variant="secondary">Szakemberfiók</Badge>
          </div>
          <nav aria-label="Irányítópult navigáció" className="flex overflow-x-auto px-3 pb-4 lg:flex-col lg:gap-2 lg:px-4">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 font-bold hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10">
                <Icon className="size-5" aria-hidden="true" />{label}
              </a>
            ))}
          </nav>
          <div className="hidden px-7 pb-7 lg:mt-auto lg:block">
            <Separator className="mb-5 bg-primary-foreground/20" />
            <p className="text-sm text-primary-foreground/70">Bejelentkezve</p>
            <p className="mt-1 truncate font-bold">{profile.email}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <p className="font-bold text-primary">Szakember-irányítópult</p>
                <h1 className="text-balance text-3xl font-black tracking-tight sm:text-4xl">Üdv, {profile.name}!</h1>
                <p className="text-muted-foreground">{profile.profession} · {profile.city}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={featured ? 'default' : 'outline'} className="px-4 py-2 text-sm">
                  {featured && <BadgeCheck data-icon="inline-start" />}{featured ? 'Kiemelt Mester' : 'Ingyenes csomag'}
                </Badge>
                <Button variant="outline" render={<Link href={`/szakemberek/${profile.id}`} />}><Eye data-icon="inline-start" />Nyilvános adatlap</Button>
              </div>
            </header>

            <AvailabilityToggle initialAvailable={profile.isAvailable} />

            <section id="attekintes" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="overview-title">
              <div><h2 id="overview-title" className="text-2xl font-black">Áttekintés</h2><p className="mt-1 text-muted-foreground">A legfontosabb profil- és érdeklődési adatok egy helyen.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader><CardDescription>Adatlap állapota</CardDescription><CardTitle>{status.label}</CardTitle><CardAction><CheckCircle2 className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent><p className="leading-relaxed text-muted-foreground">{status.description}</p></CardContent>
                </Card>
                <Card className={isTrial ? 'ring-2 ring-accent' : undefined}>
                  <CardHeader><CardDescription>{isTrial ? 'Díjmentes próbaidőszak' : 'Előfizetés'}</CardDescription><CardTitle>{isTrial ? `${remainingTrialDays} nap van hátra` : hasPaymentProblem ? 'Fizetési probléma' : featured ? 'Aktív' : 'Ingyenes'}</CardTitle><CardAction><Clock3 className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent><p className="leading-relaxed text-muted-foreground">{isTrial && trialEnd ? `A próbaidőszak vége: ${trialEnd.toLocaleDateString('hu-HU')}` : hasPaymentProblem ? 'Frissítse fizetési módját a számlázási felületen.' : featured ? 'A kiemelt megjelenés aktív.' : 'Adatlapját bármikor kiemelheti.'}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardDescription>E havi érdeklődés</CardDescription><CardTitle>{dashboard.monthlyPhoneClicks} telefonkérés</CardTitle><CardAction><PhoneCall className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent><p className="leading-relaxed text-muted-foreground">Összesen {profile.phoneClicks} rögzített telefonos kattintás.</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardDescription>Profil teljessége</CardDescription><CardTitle>{completeness}%</CardTitle><CardAction><BriefcaseBusiness className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent><Progress value={completeness}><ProgressLabel className="sr-only">Profil teljessége</ProgressLabel><ProgressValue className="sr-only" /></Progress></CardContent>
                </Card>
              </div>
            </section>

            <section id="adatlapom" className="scroll-mt-6" aria-labelledby="profile-title">
              <Card>
                <CardHeader><CardTitle id="profile-title">Adatlapom</CardTitle><CardDescription>Az itt mentett adatok jelennek meg a nyilvános szakemberi adatlapján.</CardDescription></CardHeader>
                <CardContent><DashboardProfileForm profile={profile} featured={featured} /></CardContent>
              </Card>
            </section>

            <section id="elofizetes" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="subscription-title">
              <div><h2 id="subscription-title" className="text-2xl font-black">Előfizetés és számlázás</h2><p className="mt-1 text-muted-foreground">Kezelje csomagját, fizetési módját, számláit és portfólióját.</p></div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>{featured ? 'Kiemelt Mester' : 'Emelje ki adatlapját'}</CardTitle><CardDescription>{featured ? `${profile.featuredBillingInterval === 'year' ? 'Éves' : 'Havi'} kiemelt megjelenés` : 'Kerüljön előr��bb a találatok között, és használja a portfóliót.'}</CardDescription></CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {!featured && (
                      <>
                        <p className="text-sm leading-relaxed text-muted-foreground">90 napos díjmentes próbaidőszak. Az első terhelés csak a próbaidőszak után történik; addig kötbér nélkül lemondható.</p>
                        <PaymentTrustBadges />
                        <form action={startFeaturedCheckout}><input type="hidden" name="interval" value="month" /><Button size="lg" className="w-full">Nettó 4 990 Ft/hó <ArrowUpRight data-icon="inline-end" /></Button></form>
                        <form action={startFeaturedCheckout}><input type="hidden" name="interval" value="year" /><Button size="lg" variant="outline" className="w-full">Nettó 54 990 Ft/év</Button></form>
                      </>
                    )}
                  </CardContent>
                  {featured && <CardFooter className="flex flex-wrap gap-3"><form action={openBillingPortal}><Button variant="outline"><CreditCard data-icon="inline-start" />Fizetési mód és lemondás</Button></form></CardFooter>}
                </Card>
                <Card>
                  <CardHeader><CardTitle>Munkaportfólió</CardTitle><CardDescription>{dashboard.gallery.length}/6 feltöltött kép. A portfólió a kiemelt csomag része.</CardDescription><CardAction><Camera className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <form action={uploadPortfolioImage} className="flex flex-col gap-3">
                      <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required disabled={!featured || dashboard.gallery.length >= 6} className="min-h-12 rounded-xl border border-input bg-background p-3 text-sm" />
                      <Button disabled={!featured || dashboard.gallery.length >= 6}>Kép feltöltése</Button>
                    </form>
                    {dashboard.gallery.map((image) => (
                      <form key={image.id} action={deletePortfolioImage} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                        <span className="truncate text-sm font-bold">{image.altText}</span><input type="hidden" name="imageId" value={image.id} /><Button size="sm" variant="ghost">Törlés</Button>
                      </form>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Korábbi számlák</CardTitle><CardDescription>A Stripe által kiállított számlák és fizetési állapotuk. A pénzügyi bizonylatokat 8 évig őrizzük.</CardDescription></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {dashboard.invoices.length === 0 ? <p className="rounded-xl bg-muted p-4 text-muted-foreground">Még nincs kiállított számla.</p> : dashboard.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-bold">{invoice.invoiceNumber || 'Stripe számla'}</p><p className="text-sm text-muted-foreground">{invoice.invoiceDate.toLocaleDateString('hu-HU')} · {(invoice.amountDue / 100).toLocaleString('hu-HU')} {invoice.currency.toUpperCase()}</p></div>
                      <div className="flex items-center gap-3"><Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{INVOICE_STATUS_LABELS[invoice.status] ?? 'Ismeretlen'}</Badge>{invoice.hostedInvoiceUrl && <Button size="sm" variant="outline" render={<a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" />}>Megnyitás <ArrowUpRight data-icon="inline-end" /></Button>}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section id="biztonsag" className="scroll-mt-6" aria-labelledby="security-title">
              <Card>
                <CardHeader><CardTitle id="security-title">Biztonság</CardTitle><CardDescription>Fiókja védelmi állapota és belépési adatai.</CardDescription></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><MailCheck className="size-6 shrink-0 text-primary" /><div><p className="font-bold">E-mail hitelesítve</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.identity?.emailVerified ? 'Igen, megerősítve' : 'Megerősítés szükséges'}</p></div></div>
                  <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><ShieldCheck className="size-6 shrink-0 text-primary" /><div><p className="font-bold">Kétlépcsős azonosítás</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.identity?.twoFactorEnabled ? 'Bekapcsolva' : 'Nincs bekapcsolva'}</p></div></div>
                  <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><Clock3 className="size-6 shrink-0 text-primary" /><div><p className="font-bold">Legutóbbi belépés</p><p className="mt-1 text-sm text-muted-foreground">{lastLogin}</p></div></div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  <Button variant="outline" render={<Link href="/segitseg" />}><KeyRound data-icon="inline-start" />Jelszóval kapcsolatos segítség</Button>
                  <form action={logoutDashboard}><Button variant="outline"><LogOut data-icon="inline-start" />Kijelentkezés</Button></form>
                </CardFooter>
              </Card>
              <Card className="mt-5 border-destructive/50">
                <CardHeader><CardTitle>Fiók törlése</CardTitle><CardDescription>A fiók és a személyes adatok végleges eltávolítása. Legutóbbi jogi hozzájárulás: {dashboard.latestConsent ? `${dashboard.latestConsent.termsVersion} · ${dashboard.latestConsent.acceptedAt.toLocaleString('hu-HU')}` : 'nincs rögzített esemény'}.</CardDescription></CardHeader>
                <CardContent><DeleteAccountForm /></CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
