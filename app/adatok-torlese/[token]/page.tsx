import { eq } from 'drizzle-orm'
import { ShieldAlert, Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { professionals } from '@/lib/db/schema'
import { hashToken } from '@/lib/contractor-emails'

export const metadata = {
  title: 'Profil törlése | Mesterek',
  description: 'Szakemberprofil és kapcsolódó adatok végleges törlése.',
}

export default async function DeleteContractorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tokenHash = hashToken(token)
  const [contractor] = await db
    .select({ id: professionals.id, name: professionals.name })
    .from(professionals)
    .where(eq(professionals.deletionTokenHash, tokenHash))
    .limit(1)

  async function deleteProfile() {
    'use server'
    const deleted = await db
      .delete(professionals)
      .where(eq(professionals.deletionTokenHash, tokenHash))
      .returning({ id: professionals.id })
    if (deleted.length) redirect('/adatok-torolve')
    redirect('/adatok-torlese/ervenytelen')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-10">
        <ShieldAlert className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-5 text-balance font-sans text-3xl font-black sm:text-4xl">Profil végleges törlése</h1>
        {contractor ? (
          <>
            <p className="mt-4 leading-relaxed">A(z) <strong>{contractor.name}</strong> profiljának törlése eltávolítja a platformon tárolt szakemberadatokat és a kapcsolódó érdeklődési statisztikákat. Ez a művelet nem vonható vissza.</p>
            <form action={deleteProfile} className="mt-8">
              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-3 font-black text-destructive-foreground sm:w-auto">
                <Trash2 aria-hidden="true" /> Profilom végleges törlése
              </button>
            </form>
          </>
        ) : (
          <p className="mt-4 leading-relaxed">Ez a törlési hivatkozás érvénytelen, vagy a profil már törlésre került.</p>
        )}
      </section>
    </main>
  )
}
