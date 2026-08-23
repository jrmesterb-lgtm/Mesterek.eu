import type { Metadata } from 'next'
import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft, BriefcaseBusiness, Globe, MapPin, MessageCircle, ShieldCheck, Siren } from 'lucide-react'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PortfolioGallery } from '@/components/portfolio-gallery'
import { TrackedCallLink } from '@/components/tracked-call-link'
import { db } from '@/lib/db'
import { professionals } from '@/lib/db/schema'

type Props = { params: Promise<{ id: string }> }

async function getProfessional(id: string) {
  const parsedId = Number.parseInt(id, 10)
  if (!Number.isInteger(parsedId) || parsedId <= 0) return null
  const [professional] = await db.select().from(professionals).where(and(eq(professionals.id, parsedId), eq(professionals.status, 'APPROVED'))).limit(1)
  return professional ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const professional = await getProfessional((await params).id)
  if (!professional) return { title: 'Szakember nem található' }
  return { title: `${professional.name} – ${professional.profession}`, description: professional.description.slice(0, 160) }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const professional = await getProfessional((await params).id)
  if (!professional) notFound()
  const phone = professional.phone.replace(/\s/g, '')
  const whatsapp = (professional.whatsappPhone || professional.phone).replace(/\D/g, '').replace(/^06/, '36')
  const location = `${professional.zipCode ? `${professional.zipCode} ` : ''}${professional.address || professional.city}`

  return (
    <AppShell>
      <div className="bg-muted/40">
      <main className="page-wrap">
        <Link href="/kereses" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" />Vissza a kereséshez
        </Link>

        {/* HERO HEADER */}
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground shadow-md sm:size-24 sm:text-3xl">
                {getInitials(professional.name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {professional.verifiedAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />Ellenőrzött szakember
                    </span>
                  )}
                  {professional.isEmergency247 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                      <Siren className="size-3.5" aria-hidden="true" />0-24 ügyelet
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-pretty text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">{professional.name}</h1>
                <p className="mt-1.5 flex items-center gap-2 font-bold text-primary">
                  <BriefcaseBusiness className="size-4.5 shrink-0" aria-hidden="true" />{professional.profession}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="size-4.5 shrink-0" aria-hidden="true" />{location}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 lg:max-w-xs">
              {/* AVAILABILITY STATUS */}
              {professional.isAvailable ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="relative flex size-3 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-sm font-bold text-emerald-700">Jelenleg tud új munkát vállalni</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                  <span className="size-3 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                  <p className="text-sm font-bold text-muted-foreground">Jelenleg nem vállal új munkát</p>
                </div>
              )}

              {/* CALL TO ACTION */}
              <TrackedCallLink contractorId={professional.id} phone={phone} label="Hívás most" displayPhone={professional.phone} featured compact maskUntilReveal revealLabel="Telefonszám mutatása" />
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-5 text-base font-black text-primary transition-colors hover:bg-secondary">
                    <MessageCircle className="size-5" aria-hidden="true" />WhatsApp
                  </a>
                )}
                {professional.website && (
                  <a href={professional.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-5 text-base font-black text-primary transition-colors hover:bg-secondary">
                    <Globe className="size-5" aria-hidden="true" />Weboldal
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-6">
            {/* ABOUT SECTION */}
            <section aria-labelledby="about-title" className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 id="about-title" className="text-2xl font-black text-foreground">Bemutatkozás</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/90">
                {professional.extendedBio || professional.description || 'Ez a szakember még nem töltött ki bemutatkozást.'}
              </p>
              {professional.isEmergency247 && (
                <div className="mt-6 flex items-start gap-4 rounded-xl bg-destructive/5 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Siren className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">0-24 ügyelet</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Sürgős esetben éjjel-nappal, hétvégén és ünnepnapokon is elérhető.</p>
                  </div>
                </div>
              )}
            </section>

            {/* PORTFOLIO GALLERY */}
            <section aria-labelledby="portfolio-title" className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 id="portfolio-title" className="text-2xl font-black text-foreground">Munkaportfólió</h2>
              <p className="mt-1 text-sm text-muted-foreground">Válogatás a szakember korábbi munkáiból.</p>
              <PortfolioGallery count={6} />
            </section>
        </div>
      </main>
      </div>
    </AppShell>
  )
}
