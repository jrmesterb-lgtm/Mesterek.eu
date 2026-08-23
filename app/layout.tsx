import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { CookieConsent } from '@/components/cookie-consent'
import { PwaInstallBanner } from '@/components/pwa-install-banner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: { default: 'Mesterek – Megbízható helyi szakemberek', template: '%s | Mesterek' },
  description: 'Keressen könnyen megbízható helyi szakembert, vagy regisztrálja szolgáltatását.',
  manifest: '/manifest.json',
  applicationName: 'Mesterek',
  appleWebApp: { capable: true, title: 'Mesterek', statusBarStyle: 'default' },
  icons: { apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#1e3a8a', width: 'device-width', initialScale: 1, userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hu" className="bg-background"><body className={`${geist.variable} ${geistMono.variable} antialiased`}>{children}<PwaInstallBanner /><CookieConsent /></body></html>
}
