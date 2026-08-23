import { cn } from '@/lib/utils'

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('36')) return digits
  if (digits.startsWith('06')) return `36${digits.slice(2)}`
  if (digits.startsWith('0')) return `36${digits.slice(1)}`
  return digits.length >= 8 ? `36${digits}` : ''
}

export function WhatsAppContactLink({ phone, featured = false }: { phone: string; featured?: boolean }) {
  const number = whatsappNumber(phone)
  if (!number) return null

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Kapcsolatfelvétel WhatsAppon"
      className={cn(
        'inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card px-3 text-center font-black text-primary shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
        featured ? 'min-h-20 text-base sm:text-lg' : 'min-h-12 text-sm sm:text-base',
      )}
    >
      <img
        src="https://thesvg.org/icons/whatsapp/default.svg"
        alt=""
        className={featured ? 'size-7 shrink-0' : 'size-5 shrink-0'}
        aria-hidden="true"
      />
      <span className="truncate">WhatsApp</span>
    </a>
  )
}
