import { headers } from 'next/headers'
import { ReferralBanner } from '@/components/referral-banner'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { auth } from '@/lib/auth'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  return <div className="flex min-h-screen flex-col"><SiteHeader isAuthenticated={Boolean(session?.user)} /><ReferralBanner /><main className="flex-1">{children}</main><SiteFooter /></div>
}
