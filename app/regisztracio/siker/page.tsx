import Link from 'next/link'
import { BadgeCheck, Search } from 'lucide-react'
import Stripe from 'stripe'
import { AppShell } from '@/components/app-shell'

type Props = { searchParams: Promise<{ session_id?: string }> }
export const metadata = { title: 'Sikeres regisztráció' }
export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  let confirmed = false
  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      confirmed = session.status === 'complete' && session.metadata?.product === 'FEATURED'
    } catch { confirmed = false }
  }
  return <AppShell><div className="page-wrap max-w-3xl text-center"><div className="surface py-12">{confirmed ? <><BadgeCheck className="mx-auto size-16 text-primary" aria-hidden="true" /><h1 className="mt-5 text-balance text-4xl font-black text-primary">Sikeres regisztráció</h1><p className="mt-5 text-xl leading-relaxed">Szakember-adatlapja adminisztrátori ellenőrzésre vár. A 90 napos Kiemelt Mester próbaidőszak elindult; a Stripe e-mailben elküldi az előfizetés és a későbbi terhelés részleteit.</p></> : <><h1 className="text-balance text-4xl font-black text-primary">A visszaigazolás folyamatban van</h1><p className="mt-5 text-xl leading-relaxed">Nem tudtuk azonnal megerősíteni a Stripe munkamenetet. Ellenőrizze az e-mailjeit, vagy kérjen segítséget telefonon.</p></>}<Link href="/kereses" className="btn-primary mt-8"><Search aria-hidden="true" />Szakemberek megtekintése</Link></div></div></AppShell>
}
