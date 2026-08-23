'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Stage = 'closed' | 'bursting' | 'revealed'

/** Brand palette for the confetti explosion (canvas-confetti needs literal hex values). */
const BRAND_CONFETTI = ['#f4c542', '#123d70', '#e5484d', '#ffffff', '#2ea043']

/** Reward card settles in on a spring, then cascades its contents. */
const CARD_SPRING = {
  hidden: { scale: 0.78, opacity: 0, y: 28 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 21, mass: 0.9, delayChildren: 0.12, staggerChildren: 0.06 },
  },
}

const CARD_REDUCED = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

/**
 * The unopened gift: a loot-box style idle loop that pops on open.
 * Kept as its own component so framer-motion drives the looping idle
 * animation from a real mount rather than a conditional swap.
 */
function AnimatedGift({ bursting, reduceMotion }: { bursting: boolean; reduceMotion: boolean }) {
  return (
    <>
      {/* Pulsing glow behind the box */}
      <motion.span
        aria-hidden="true"
        className="absolute size-32 rounded-full bg-accent/35 blur-3xl"
        initial={{ scale: 1, opacity: 0.45 }}
        animate={reduceMotion || bursting ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.25, 1], opacity: [0.45, 0.85, 0.45] }}
        transition={reduceMotion ? { duration: 0 } : { type: 'tween', duration: 2.4, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Loot-box anticipation: shake, wiggle and pulse, then pop on open */}
      <motion.span
        aria-hidden="true"
        className="relative select-none text-8xl leading-none drop-shadow-[0_18px_35px_rgba(0,0,0,0.45)]"
        initial={{ rotate: 0, scale: 1, y: 0, opacity: 1 }}
        animate={
          bursting
            ? { scale: [1, 0.84, 1.55], rotate: [0, -8, 10], opacity: [1, 1, 0] }
            : reduceMotion
              ? { rotate: 0, scale: 1, y: 0, opacity: 1 }
              : {
                  rotate: [0, -12, 12, -9, 6, -3, 0, 0],
                  scale: [1, 1.08, 1.08, 1.05, 1.03, 1.01, 1, 1],
                  y: [0, -10, -4, -7, -2, 0, 0, 0],
                }
        }
        transition={
          bursting
            ? { type: 'tween', duration: 0.44, ease: [0.22, 1, 0.36, 1] }
            : reduceMotion
              ? { duration: 0 }
              : { type: 'tween', duration: 3, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }
        }
      >
        🎁
      </motion.span>
    </>
  )
}

export function ReferralGiftModal({
  referralCode,
  open,
  onOpenChange,
}: {
  referralCode: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const referralLink = `mesterek.eu/csatlakozas?ref=${referralCode}`
  const [stage, setStage] = useState<Stage>('closed')
  const [copied, setCopied] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reduceMotion = useReducedMotion()

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Reset to the unopened gift each time the modal is dismissed.
  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout)
      timers.current = []
      setStage('closed')
      setCopied(false)
    }
  }, [open])

  /** Multi-stage confetti explosion: centre blast, side cannons, then a slow sprinkle. */
  const fireConfetti = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti')
    const base = { colors: BRAND_CONFETTI, zIndex: 2000, disableForReducedMotion: true }

    confetti({ ...base, particleCount: 130, spread: 95, startVelocity: 48, scalar: 1.1, origin: { x: 0.5, y: 0.56 } })
    confetti({ ...base, particleCount: 55, angle: 60, spread: 70, startVelocity: 42, origin: { x: 0, y: 0.72 } })
    confetti({ ...base, particleCount: 55, angle: 120, spread: 70, startVelocity: 42, origin: { x: 1, y: 0.72 } })

    timers.current.push(
      setTimeout(() => {
        confetti({ ...base, particleCount: 90, spread: 130, startVelocity: 26, decay: 0.92, scalar: 0.85, gravity: 0.7, origin: { x: 0.5, y: 0.4 } })
      }, 280),
    )
  }, [])

  const handleOpenGift = useCallback(() => {
    if (stage !== 'closed') return
    setStage('bursting')
    void fireConfetti()
    timers.current.push(setTimeout(() => setStage('revealed'), reduceMotion ? 0 : 430))
  }, [stage, fireConfetti, reduceMotion])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); still show feedback.
    }
    setCopied(true)
    timers.current.push(setTimeout(() => setCopied(false), 2400))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 backdrop-blur-sm"
        className="border-0 bg-transparent p-0 opacity-100 shadow-none backdrop-blur-none sm:max-w-md"
      >
        {stage === 'revealed' ? (
            <motion.div
              key="reward"
              variants={reduceMotion ? CARD_REDUCED : CARD_SPRING}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card px-6 pt-8 pb-6 text-center shadow-2xl ring-1 ring-black/5"
            >
              <motion.span
                aria-hidden="true"
                className="text-6xl leading-none"
                initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 340, damping: 14 }}
              >
                🎁
              </motion.span>

              <motion.div variants={FADE_UP}>
                <DialogTitle className="text-balance text-2xl font-extrabold leading-tight text-foreground">
                  Kaptál +1 hónap ingyenes Kiemelt Mester előfizetést!
                </DialogTitle>
              </motion.div>

              <motion.div variants={FADE_UP}>
                <DialogDescription className="text-pretty text-base leading-relaxed text-muted-foreground">
                  Hívd meg egy szakmabeli ismerősödet! Ha az alábbi linkeden keresztül regisztrál, és a 60 napos
                  próbaidő letelte után az első havi díja sikeresen levonásra kerül, mindketten kaptok +1 hónap
                  ingyenes előfizetést automatikusan jóváírva!
                </DialogDescription>
              </motion.div>

              <motion.p
                variants={FADE_UP}
                className="w-full truncate rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-semibold text-foreground"
              >
                {referralLink}
              </motion.p>

              <motion.div variants={FADE_UP} className="flex w-full flex-col items-center gap-1">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleCopy}
                  aria-live="polite"
                  className={copied
                    ? 'h-14 w-full bg-green-600 text-lg font-black text-white hover:bg-green-600'
                    : 'h-14 w-full text-lg font-black'}
                >
                  {copied
                    ? <><Check data-icon="inline-start" className="size-6" aria-hidden="true" />Link másolva!</>
                    : <><Copy data-icon="inline-start" className="size-6" aria-hidden="true" />Meghívó link másolása</>}
                </Button>

                <DialogClose
                  render={
                    <button
                      type="button"
                      className="min-h-11 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    />
                  }
                >
                  Később
                </DialogClose>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-7 px-2 py-6 text-center">
              <DialogTitle className="text-balance text-3xl font-bold leading-tight text-white">
                Meglepetésünk van számodra!
              </DialogTitle>

              <DialogDescription className="sr-only">
                Nyisd ki az ajándékot, és tudd meg, hogyan szerezhetsz ingyenes Kiemelt Mester előfizetést.
              </DialogDescription>

              <button
                type="button"
                onClick={handleOpenGift}
                aria-label="Ajándék kinyitása"
                className="relative flex size-44 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70"
              >
                <AnimatedGift bursting={stage === 'bursting'} reduceMotion={Boolean(reduceMotion)} />
              </button>

              <Button
                type="button"
                size="lg"
                onClick={handleOpenGift}
                className="h-14 w-full max-w-xs bg-accent text-lg font-black text-accent-foreground hover:bg-accent/90"
              >
                <span data-icon="inline-start" className="text-2xl leading-none" aria-hidden="true">🎁</span>
                Ajándék kinyitása
              </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
