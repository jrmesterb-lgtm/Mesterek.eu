import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MailCheck,
  PhoneCall,
  Plus,
  QrCode,
  Share2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AnimatedLogoMark } from '@/components/animated-logo-mark'
import { DashboardReferral } from '@/components/dashboard-referral'
import { PortfolioFileInput } from '@/components/portfolio-file-input'
import { AvailabilityToggle } from '@/components/availability-toggle'
import { DashboardProfileForm } from '@/components/dashboard-profile-form'
import { DeleteAccountForm } from '@/components/delete-account-form'
import { PaymentTrustBadges } from '@/components/payment-trust-badges'
import { ProfileQrCard } from '@/components/profile-qr-card'
import { ProfileShareCard } from '@/components/profile-share-card'
import { SubscriptionCheckoutButtons } from '@/components/subscription-checkout-buttons'
import { SubscriptionComparison } from '@/components/subscription-comparison'
import { TwoFactorSettings } from '@/components/two-factor-settings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getAppOrigin } from '@/lib/app-origin'
import { getAuthenticatedContractorDashboard } from '@/lib/contractor-dashboard'
import { hasActivePremium } from '@/lib/premium'
import { deletePortfolioImage, logoutDashboard, openBillingPortal, uploadPortfolioImage } from './actions'

export const metadata = { title: 'Szakember-irányítópult', robots: { index: false, follow: false } }

const NAVIGATION = [
  { href: '#elofizetes', label: 'Előfizetés', icon: CreditCard },
  { href: '#munkaportfolio', label: 'Munkaportfólió', icon: Camera },
  { href: '#profi-megjelenes', label: 'Profi Megjelenés', icon: Share2 },
  { href: '#qr-kod', label: 'QR kód', icon: QrCode },
  { href: '#attekintes', label: 'Áttekintés', icon: LayoutDashboard },
  { href: '#adatlapom', label: 'Adatlapom', icon: UserRound },
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

const TRIAL_DURATION_DAYS = 60
const DAY_IN_MS = 86_400_000
const PAID_SUBSCRIPTION_STATUSES = new Set(['active'])

function subscriptionState(profile: {
  createdAt: Date
  stripeSubscriptionStatus: string | null
}) {
  const trialEnd = new Date(profile.createdAt.getTime() + TRIAL_DURATION_DAYS * DAY_IN_MS)
  const remainingTrialDays = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / DAY_IN_MS))
  const hasActivePaidSubscription = PAID_SUBSCRIPTION_STATUSES.has(profile.stripeSubscriptionStatus ?? '')
  const hasPaymentProblem = profile.stripeSubscriptionStatus === 'past_due' || profile.stripeSubscriptionStatus === 'unpaid'

  return {
    trialEnd,
    remainingTrialDays,
    hasActivePaidSubscription,
    hasPaymentProblem,
    isTrial: !hasActivePaidSubscription && remainingTrialDays > 0,
    isTrialExpired: !hasActivePaidSubscription && remainingTrialDays === 0,
  }
}

export default async function DashboardPage() {
  const dashboard = await getAuthenticatedContractorDashboard().catch(() => null)
  if (!dashboard) redirect('/belepes')

  const profile = dashboard.professional
  const featured = hasActivePremium(profile)
  const status = STATUS_LABELS[profile.status]
  const {
    trialEnd,
    remainingTrialDays,
    hasActivePaidSubscription,
    hasPaymentProblem,
    isTrial,
    isTrialExpired,
  } = subscriptionState(profile)
  const showUpgradeOptions = !hasActivePaidSubscription && !hasPaymentProblem
  const canManageBilling = Boolean(profile.stripeCustomerId)
  const subscriptionBadge = hasActivePaidSubscription
    ? 'Aktív előfizetés'
    : isTrial
      ? `${remainingTrialDays} nap próbaidő`
      : 'Próbaidőszak lejárt'
  const completenessFields = [profile.name, profile.billingName, profile.email, profile.phone, profile.profession, profile.description, profile.city, profile.isEmergency247 || profile.website]
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100)
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col lg:flex-row">
        <aside className="bg-primary text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col">
          <div className="flex items-center justify-between gap-4 px-5 py-5 lg:flex-col lg:items-start lg:px-7 lg:py-8">
            <Link href="/" className="flex items-center gap-3 rounded-xl font-black tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground" aria-label="mesterek.eu kezdőlap">
              <AnimatedLogoMark />
              <span className="text-xl">mesterek.eu</span>
            </Link>
            <Badge variant="secondary">Szakemberfiók</Badge>
          </div>
          <nav aria-label="Irányítópult navigáció" className="flex overflow-x-auto px-3 pb-4 lg:flex-col lg:gap-2 lg:px-4">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 font-bold hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10">
                <Icon className="size-5" aria-hidden="true" />{label}
              </a>
            ))}
          </nav>
          <div className="px-5 pb-4 lg:mt-auto lg:px-7 lg:pb-0">
            <DashboardReferral referralCode={String(profile.id)} />
          </div>
          <div className="hidden px-7 pb-7 lg:mt-4 lg:block">
            <Separator className="mb-5 bg-primary-foreground/20" />
            <div className="flex flex-col gap-3 rounded-xl bg-primary-foreground/10 p-4">
              <div>
                <p className="font-bold text-primary-foreground">Ügyfélszolgálat</p>
                <p className="mt-1 text-sm leading-relaxed text-primary-foreground/70">Segítünk, ha kérdése van a fiókjával kapcsolatban.</p>
              </div>
              <a href="mailto:info@mesterek.eu" className="flex items-center gap-2 text-sm font-bold text-primary-foreground underline-offset-4 hover:underline">
                <MailCheck className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">info@mesterek.eu</span>
              </a>
              <a href="tel:+36301234567" className="flex items-center gap-2 text-sm font-bold text-primary-foreground underline-offset-4 hover:underline">
                <PhoneCall className="size-4 shrink-0" aria-hidden="true" />
                +36 30 123 4567
              </a>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/70">Bejelentkezve</p>
            <p className="mt-1 truncate font-bold">{profile.email}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-muted/40 pb-24 lg:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10 [&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:shadow-md [&_[data-slot=card]]:ring-0 [&_[data-slot=card]]:[--card-spacing:--spacing(6)]">
            <div className="flex justify-end">
              <form action={logoutDashboard}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <LogOut data-icon="inline-start" />Kijelentkezés
                </Button>
              </form>
            </div>
            <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">Szakember-irányítópult</p>
                <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">Üdv, {profile.name}!</h1>
                <p className="text-muted-foreground">{profile.profession} · {profile.city}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {(hasActivePaidSubscription || isTrial) && <BadgeCheck className="size-3.5" aria-hidden="true" />}{subscriptionBadge}
                </span>
                <Link
                  href={`/szakemberek/${profile.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <Eye className="size-3.5" aria-hidden="true" />Nyilvános adatlap
                </Link>
              </div>
            </header>

            <AvailabilityToggle initialAvailable={profile.isAvailable} />

            {showUpgradeOptions && <SubscriptionComparison />}

            <section id="elofizetes" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="subscription-title">
              <div><h2 id="subscription-title" className="text-2xl font-black">Előfizetés és számlázás</h2><p className="mt-1 text-muted-foreground">Kezelje csomagját, fizetési módját és számláit.</p></div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{hasActivePaidSubscription ? 'Kiemelt Mester' : isTrial ? '60 napos próbaidőszak' : hasPaymentProblem ? 'Fizetési mód frissítése' : 'Folytassa Kiemelt Mesterként'}</CardTitle>
                    <CardDescription>
                      {hasActivePaidSubscription
                        ? `${profile.featuredBillingInterval === 'year' ? 'Éves' : 'Havi'} kiemelt megjelenés`
                        : isTrial
                          ? `Még ${remainingTrialDays} nap díjmentes hozzáférés · ${trialEnd.toLocaleDateString('hu-HU')}-ig`
                          : hasPaymentProblem
                            ? 'A kiemelt megjelenés fenntartásához rendezze a fizetést.'
                            : 'A próbaidőszak lejárt. Válasszon csomagot a kiemelt megjelenéshez és a portfólióhoz.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {showUpgradeOptions && (
                      <>
                        <p className="text-sm leading-relaxed text-muted-foreground">Kerüljön előrébb a találatok között, és használja a munkaportfóliót aktív előfizetéssel.</p>
                        <PaymentTrustBadges />
                        <SubscriptionCheckoutButtons />
                      </>
                    )}
                  </CardContent>
                  {canManageBilling && <CardFooter className="flex flex-wrap gap-3"><form action={openBillingPortal}><Button variant="outline"><CreditCard data-icon="inline-start" />Fizetési mód és lemondás</Button></form></CardFooter>}
                </Card>
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
              </div>
            </section>

            <section id="munkaportfolio" className="scroll-mt-6" aria-labelledby="portfolio-title">
              <Card>
                <CardHeader><CardTitle id="portfolio-title">Munkaportfólió</CardTitle><CardDescription>{dashboard.gallery.length}/6 feltöltött kép. A portfólió a kiemelt csomag része.</CardDescription><CardAction><Camera className="size-6 text-primary" /></CardAction></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {dashboard.gallery.length === 0 ? (
                    <form action={uploadPortfolioImage} className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                      <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ImageIcon className="size-10" strokeWidth={1.75} />
                      </span>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-balance text-xl font-black text-foreground">Még nem töltöttél fel képet</h3>
                        <p className="max-w-sm text-pretty text-base leading-relaxed text-muted-foreground">Tölts fel képeket a korábbi munkáidról, hogy a megrendelők lássák, milyen szépen dolgozol!</p>
                      </div>
                      <PortfolioFileInput disabled={!featured} />
                      <Button size="lg" disabled={!featured} className="h-14 w-full max-w-sm text-lg font-black"><Plus data-icon="inline-start" className="size-6" />Kép feltöltése</Button>
                      {!featured && <p className="text-sm font-bold text-muted-foreground">A portfólió a kiemelt csomag része.</p>}
                    </form>
                  ) : (
                    <form action={uploadPortfolioImage} className="flex flex-col gap-3">
                      <PortfolioFileInput disabled={!featured || dashboard.gallery.length >= 6} />
                      <Button disabled={!featured || dashboard.gallery.length >= 6}><Plus data-icon="inline-start" />Kép feltöltése</Button>
                    </form>
                  )}
                  {dashboard.gallery.map((image) => (
                    <form key={image.id} action={deletePortfolioImage} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                      <span className="truncate text-sm font-bold">{image.altText}</span><input type="hidden" name="imageId" value={image.id} /><Button size="sm" variant="ghost">Törlés</Button>
                    </form>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section id="profi-megjelenes" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="marketing-title">
              <div>
                <h2 id="marketing-title" className="text-2xl font-black">Profi Megjelenés</h2>
                <p className="mt-1 text-muted-foreground">Szerezz több ügyfelet a saját adatlapoddal.</p>
              </div>
              <ProfileShareCard profileUrl={`${getAppOrigin()}/szakemberek/${profile.id}`} />
            </section>

            <section id="qr-kod" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="qr-title">
              <div>
                <h2 id="qr-title" className="text-2xl font-black">QR kód</h2>
                <p className="mt-1 text-muted-foreground">Vidd offline is a nyilvános adatlapodat.</p>
              </div>
              <ProfileQrCard profileUrl={`${getAppOrigin()}/szakemberek/${profile.id}`} fileSlug={String(profile.id)} />
            </section>

            <section aria-labelledby="account-summary-title">
              <Card>
                <CardHeader>
                  <CardTitle id="account-summary-title">Szakemberfiók</CardTitle>
                  <CardDescription>A bejelentkezett fiók legfontosabb adatai.</CardDescription>
                  <CardAction>
                    <Badge variant={profile.status === 'APPROVED' ? 'default' : 'secondary'}>
                      <BadgeCheck data-icon="inline-start" />
                      {profile.status}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/60 bg-secondary/50 p-5">
                    <p className="text-sm font-bold text-muted-foreground">Név</p>
                    <p className="text-pretty font-bold">{profile.name}</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/60 bg-secondary/50 p-5">
                    <p className="text-sm font-bold text-muted-foreground">E-mail-cím</p>
                    <p className="break-all font-bold">{profile.email}</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/60 bg-secondary/50 p-5">
                    <p className="text-sm font-bold text-muted-foreground">Telefonszám</p>
                    <p className="font-bold">{profile.phone}</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/60 bg-secondary/50 p-5">
                    <p className="text-sm font-bold text-muted-foreground">Jóváhagyás</p>
                    <p className="font-bold">{status.label}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="attekintes" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="overview-title">
              <div><h2 id="overview-title" className="text-2xl font-black">Áttekintés</h2><p className="mt-1 text-muted-foreground">A legfontosabb profil- és érdeklődési adatok egy helyen.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader><CardDescription>Adatlap állapota</CardDescription><CardTitle>{status.label}</CardTitle><CardAction><CheckCircle2 className="size-6 text-primary" /></CardAction></CardHeader>
                  <CardContent><p className="leading-relaxed text-muted-foreground">{status.description}</p></CardContent>
                </Card>
                <Card className={isTrial ? 'ring-2! ring-accent!' : isTrialExpired ? 'ring-2! ring-destructive!' : undefined}>
                  <CardHeader>
                    <CardDescription>Előfizetés</CardDescription>
                    <CardTitle>
                      {hasPaymentProblem
                        ? 'Fizetési probléma'
                        : hasActivePaidSubscription
                          ? 'Aktív előfizetés'
                          : isTrial
                            ? `Próbaidőszak (Még ${remainingTrialDays} nap hátra)`
                            : 'Próbaidőszak lejárt'}
                    </CardTitle>
                    <CardAction><Clock3 className="size-6 text-primary" /></CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-muted-foreground">
                      {hasPaymentProblem
                        ? 'Frissítse fizetési módját a számlázási felületen.'
                        : hasActivePaidSubscription
                          ? 'A fizetett kiemelt megjelenés aktív.'
                          : isTrial
                            ? `A 60 napos próbaidőszak vége: ${trialEnd.toLocaleDateString('hu-HU')}`
                            : 'A további kiemelt megjelenéshez válasszon előfizetést fent.'}
                    </p>
                  </CardContent>
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

            <section id="biztonsag" className="scroll-mt-6" aria-labelledby="security-title">
              <Card>
                <CardHeader><CardTitle id="security-title">Biztonság</CardTitle><CardDescription>Fiókja védelmi állapota és belépési adatai.</CardDescription></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><MailCheck className="size-6 shrink-0 text-primary" /><div><p className="font-bold">E-mail hitelesítve</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.identity?.emailVerified ? 'Igen, megerősítve' : 'Megerősítés szükséges'}</p></div></div>
                  <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><ShieldCheck className="size-6 shrink-0 text-primary" /><div className="flex min-w-0 flex-1 flex-col gap-3"><div><p className="font-bold">Kétlépcsős azonosítás</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.identity?.twoFactorEnabled ? 'Bekapcsolva' : 'Nincs bekapcsolva'}</p></div><div><TwoFactorSettings enabled={Boolean(dashboard.identity?.twoFactorEnabled)} /></div></div></div>
                </CardContent>
              </Card>
              <Card className="mt-5">
                <CardHeader>
                  <CardTitle>Adatok letöltése</CardTitle>
                  <CardDescription>Töltse le a fiókjához kapcsolódó személyes, profil-, számlázási és hozzájárulási adatokat géppel olvasható JSON-formátumban.</CardDescription>
                  <CardAction><Download className="size-6 text-primary" aria-hidden="true" /></CardAction>
                </CardHeader>
                <CardContent>
                  <Button render={<a href="/api/dashboard/data-export" download />}>
                    <Download data-icon="inline-start" aria-hidden="true" />
                    Saját adataim letöltése
                  </Button>
                </CardContent>
              </Card>
              <Card className="mt-5 ring-1! ring-destructive/30!">
                <CardHeader><CardTitle>Fiók törlése</CardTitle><CardDescription>A fiók és a személyes adatok végleges eltávolítása. Legutóbbi jogi hozzájárulás: {dashboard.latestConsent ? `${dashboard.latestConsent.termsVersion} · ${dashboard.latestConsent.acceptedAt.toLocaleString('hu-HU')}` : 'nincs rögzített esemény'}.</CardDescription></CardHeader>
                <CardContent><DeleteAccountForm /></CardContent>
              </Card>
            </section>

            <footer className="border-t border-border/70 pt-6 text-sm text-muted-foreground">
              <nav aria-label="Jogi információk" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6">
                <Link href="/aszf" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  Általános Szerződési Feltételek (ÁSZF)
                </Link>
                <Link href="/adatvedelem" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  Adatvédelmi Tájékoztató
                </Link>
                <Link href="/impresszum" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  Impresszum
                </Link>
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </main>
  )
}
