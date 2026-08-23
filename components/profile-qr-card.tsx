'use client'

import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const DOWNLOAD_SIZE = 1024
const QUIET_ZONE = 64

export function ProfileQrCard({ profileUrl, fileSlug }: { profileUrl: string; fileSlug: string }) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    setIsPreparing(true)

    const serialized = new XMLSerializer().serializeToString(svg)
    const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const total = DOWNLOAD_SIZE + QUIET_ZONE * 2
      canvas.width = total
      canvas.height = total
      const context = canvas.getContext('2d')
      if (!context) {
        setIsPreparing(false)
        return
      }
      // White quiet zone keeps the code scannable when printed on stickers or cards.
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, total, total)
      context.imageSmoothingEnabled = false
      context.drawImage(image, QUIET_ZONE, QUIET_ZONE, DOWNLOAD_SIZE, DOWNLOAD_SIZE)

      canvas.toBlob((blob) => {
        if (!blob) {
          setIsPreparing(false)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mesterek-qr-${fileSlug}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        setIsPreparing(false)
      }, 'image/png')
    }

    image.onerror = () => setIsPreparing(false)
    image.src = source
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <div
          ref={qrRef}
          className="shrink-0 rounded-xl border border-border bg-white p-4 shadow-sm"
        >
          <QRCode
            value={profileUrl}
            size={148}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            title="A nyilvános adatlapod QR kódja"
          />
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3 sm:items-start">
          <h3 className="text-xl font-bold text-primary">Saját QR kódod</h3>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Nyomtasd a névjegykártyádra, vagy készíts belőle matricát a furgonodra! Aki leolvassa, azonnal a te privát adatlapodra jut, és egy gombnyomással hívhat.
          </p>
          <p className="w-full truncate text-sm font-bold text-muted-foreground/80" title={profileUrl}>
            {profileUrl}
          </p>
          <Button onClick={handleDownload} disabled={isPreparing} className="mt-1 h-12 w-full text-base font-black sm:w-auto">
            <Download data-icon="inline-start" aria-hidden="true" />
            {isPreparing ? 'Előkészítés…' : 'QR kód letöltése'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
