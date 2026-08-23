import { AppShell } from '@/components/app-shell'
import { RegistrationForm } from '@/components/registration-form'

export const metadata = { title: 'Szakember-regisztráció' }
type Props = { searchParams: Promise<{ megszakitva?: string }> }
export default async function RegistrationPage({ searchParams }: Props) {
  const params = await searchParams
  return <AppShell><div className="page-wrap max-w-5xl"><h1 className="page-title">Szakember-regisztráció</h1><p className="page-lead">Mutassa be szolgáltatását a helyi ügyfeleknek. A regisztrációval 60 napos Kiemelt Mester próbaidőszak indul, amely alatt a próbaidőszak bármikor, kötbér nélkül lemondható. Ennek elmaradása esetén a választott havi vagy éves előfizetés automatikusan folytatódik.</p><RegistrationForm cancelled={params.megszakitva === '1'} /></div></AppShell>
}
