import { notFound, redirect } from 'next/navigation'
import { getContractorDashboard } from '@/lib/contractor-dashboard'

export default async function ClaimDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const dashboard = await getContractorDashboard(token)
  if (!dashboard) notFound()
  redirect('/regisztracio')
}
