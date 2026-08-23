'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type PortfolioGalleryProps = {
  /** Real image URLs when available. Empty entries render as placeholders. */
  images?: (string | null)[]
  count?: number
}

export function PortfolioGallery({ images, count = 6 }: PortfolioGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const tiles = images && images.length > 0 ? images.slice(0, count) : Array.from<string | null>({ length: count }).fill(null)
  const activeSrc = openIndex !== null ? tiles[openIndex] : null

  const showPrev = () => setOpenIndex((current) => (current === null ? current : (current - 1 + tiles.length) % tiles.length))
  const showNext = () => setOpenIndex((current) => (current === null ? current : (current + 1) % tiles.length))

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {tiles.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`Munkafotó ${index + 1} megnyitása nagyban`}
            className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-muted transition-shadow duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src || '/placeholder.svg'} alt={`Munkafotó ${index + 1}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground/50 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            )}
            <span className="absolute inset-x-0 bottom-0 translate-y-full bg-primary/85 px-3 py-2 text-xs font-bold text-primary-foreground transition-transform duration-300 group-hover:translate-y-0">
              Munkafotó {index + 1}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/80 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
          className="flex max-w-[calc(100%-1.5rem)] items-center justify-center border-0 bg-transparent p-0 ring-0 shadow-none sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">{openIndex !== null ? `Munkafotó ${openIndex + 1}` : 'Munkafotó'}</DialogTitle>

          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Bezárás"
            className="absolute -top-2 right-0 z-10 flex size-12 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:-top-4 sm:-right-4"
          >
            <X className="size-6" aria-hidden="true" />
          </button>

          {tiles.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Előző kép"
                className="absolute top-1/2 left-2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:left-3"
              >
                <ChevronLeft className="size-7" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Következő kép"
                className="absolute top-1/2 right-2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:right-3"
              >
                <ChevronRight className="size-7" aria-hidden="true" />
              </button>
            </>
          )}

          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeSrc || '/placeholder.svg'} alt={`Munkafotó ${openIndex !== null ? openIndex + 1 : ''}`} className="max-h-[80vh] w-auto rounded-2xl object-contain" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ImageIcon className="size-16" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-base font-bold">Munkafotó {openIndex !== null ? openIndex + 1 : ''}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
