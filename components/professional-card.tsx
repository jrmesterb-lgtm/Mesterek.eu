import Link from 'next/link'
import { BadgeCheck, BriefcaseBusiness, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Professional } from '@/lib/db/schema'
import { RatingSummary } from '@/components/rating-summary'
import { TrackedCallLink } from '@/components/tracked-call-link'
import { WhatsAppContactLink } from '@/components/whatsapp-contact-link'
import { hasActivePremium } from '@/lib/premium'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('hu-HU')
}

type DirectoryProfessional = Professional & { gallery?: Array<{ id: number; altText: string }>; averageRating?: number; reviewCount?: number }

function AvailabilityBadge({ available }: { available: boolean }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black ${available ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200' : 'border-amber-700 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200'}`} aria-label={available ? 'Elérhetőség: Szabad' : 'Elérhetőség: Elfoglalt'}><span className={`size-2.5 rounded-full ${available ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-700 dark:bg-amber-400'}`} aria-hidden="true" />{available ? 'Szabad' : 'Elfoglalt'}</span>
}

export function ProfessionalCard({ professional }: { professional: DirectoryProfessional }) {
  const premium = hasActivePremium(professional)
  const verified = Boolean(professional.verifiedAt)
  const phone = professional.phone.replace(/\s/g, '')

  if (premium) {
    return <article className="relative flex w-full max-w-full min-w-0 flex-col gap-6 overflow-hidden rounded-3xl border border-primary/60 bg-secondary p-5 pt-16 shadow-[0_2px_4px_rgb(18_61_112/0.08),0_12px_30px_rgb(18_61_112/0.14),0_30px_60px_rgb(18_61_112/0.08)] sm:rounded-2xl sm:border-2 sm:border-primary sm:p-7 sm:pt-16 sm:shadow-xl sm:shadow-primary/15 lg:flex-row lg:items-stretch lg:justify-between">
      {professional.isEmergency247 && <span className="sos-badge absolute right-4 top-4 z-10" aria-label="SOS, éjjel-nappal elérhető"><span className="sos-dot" aria-hidden="true" />SOS 0-24</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary font-sans text-2xl font-black text-primary-foreground shadow-md" aria-label={`${professional.name} monogramja`}>{initials(professional.name)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2"><AvailabilityBadge available={professional.isAvailable} />{verified && <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground"><ShieldCheck className="size-5" aria-hidden="true" />Ellenőrzött</span>}</div>
            <h2 className="mt-3 max-w-full break-words text-pretty text-xl font-black text-primary [overflow-wrap:anywhere] sm:text-3xl"><Link href={`/szakemberek/${professional.id}`} className="hover:underline">{professional.name}</Link></h2>
            <p className="mt-1 max-w-full break-words text-lg font-bold text-foreground [overflow-wrap:anywhere] sm:text-xl">{professional.profession}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-base font-bold text-muted-foreground">
          <p className="flex items-center gap-2"><MapPin className="size-5 text-primary" aria-hidden="true" />{professional.zipCode ? `${professional.zipCode} ` : ''}{professional.address || professional.city}</p>
          <RatingSummary average={professional.averageRating ?? 0} count={professional.reviewCount ?? 0} />
        </div>
        {(professional.extendedBio || professional.description) && <p className="max-w-3xl text-base leading-relaxed text-foreground sm:text-lg">{professional.extendedBio || professional.description}</p>}
        {professional.gallery && professional.gallery.length > 0 && <div className="flex gap-3 overflow-x-auto" aria-label="Munkaportfólió">{professional.gallery.slice(0, 4).map((image) => <img key={image.id} src={`/api/portfolio/${image.id}`} alt={image.altText} className="h-24 w-32 shrink-0 rounded-xl object-cover" loading="lazy" />)}</div>}
        <p className="flex items-center gap-2 text-sm font-black text-primary"><BadgeCheck className="size-5" aria-hidden="true" />Kiemelt Mester</p>
      </div>
      <div className="flex shrink-0 flex-col justify-end gap-3 lg:w-96">
        <div className="grid grid-cols-2 gap-2">
          <TrackedCallLink contractorId={professional.id} phone={phone} label="Hívás most" displayPhone={professional.phone} featured />
          <WhatsAppContactLink phone={professional.whatsappPhone || professional.phone} featured />
        </div>
        {professional.viberPhone && <a href={`viber://chat?number=${encodeURIComponent(professional.viberPhone)}`} className="btn-outline min-h-14 w-full"><MessageCircle aria-hidden="true" />Viber</a>}
      </div>
    </article>
  }

  return <article className={`relative flex w-full max-w-full min-w-0 flex-col gap-5 overflow-hidden rounded-3xl border border-border/65 bg-card p-5 shadow-[0_1px_2px_rgb(18_32_51/0.05),0_9px_24px_rgb(18_32_51/0.08),0_24px_46px_rgb(18_32_51/0.05)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl sm:border-border sm:shadow-none ${professional.isEmergency247 ? 'pt-16 sm:pt-16' : ''}`}>
    {professional.isEmergency247 && <span className="sos-badge absolute right-4 top-4 z-10" aria-label="SOS, éjjel-nappal elérhető"><span className="sos-dot" aria-hidden="true" />SOS 0-24</span>}
    <div className="flex min-w-0 max-w-full flex-1 gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><BriefcaseBusiness className="size-6" aria-hidden="true" /></span><div className="min-w-0 max-w-full"><div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="max-w-full break-words text-lg font-black text-primary [overflow-wrap:anywhere] sm:text-xl"><Link href={`/szakemberek/${professional.id}`} className="hover:underline">{professional.name}</Link></h2><AvailabilityBadge available={professional.isAvailable} />{verified && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-black text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Ellenőrzött</span>}</div><p className="max-w-full break-words font-bold [overflow-wrap:anywhere]">{professional.profession}</p><p className="mt-1 flex min-w-0 items-start gap-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{professional.zipCode ? `${professional.zipCode} ` : ''}{professional.address || professional.city}</p><div className="mt-3"><RatingSummary average={professional.averageRating ?? 0} count={professional.reviewCount ?? 0} /></div></div></div>
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-96"><TrackedCallLink contractorId={professional.id} phone={phone} label="Hívás most" displayPhone={professional.phone} /><WhatsAppContactLink phone={professional.whatsappPhone || professional.phone} /></div>
  </article>
}
