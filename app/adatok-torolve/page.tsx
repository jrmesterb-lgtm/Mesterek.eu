import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Profil törölve | Mesterek',
  robots: { index: false, follow: false },
}

export default function ContractorDeletedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-10">
        <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-balance font-sans text-3xl font-black sm:text-4xl">A profil törlése megtörtént</h1>
        <p className="mt-4 leading-relaxed">A szakemberprofilt és a hozzá kapcsolódó érdeklődési adatokat véglegesen eltávolítottuk a platformról.</p>
        <Link href="/" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 font-black text-primary-foreground">Vissza a főoldalra</Link>
      </section>
    </main>
  )
}
