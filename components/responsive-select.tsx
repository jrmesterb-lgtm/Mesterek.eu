'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type Option = { value: string; label: string }

/**
 * Shared, reference-counted body scroll lock. Because the auto-stepping flow
 * opens/closes three separate modals in overlapping renders (and navigates away
 * on auto-search), each modal must NOT capture/restore its own `previous`
 * overflow value — an instance can otherwise "restore" a stale `hidden` left by
 * another instance and freeze the page. Instead we count active locks and only
 * release the body when the last modal closes.
 */
let scrollLockCount = 0

function lockBodyScroll() {
  scrollLockCount += 1
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.body.style.overflow = ''
  }
  // Always release pointer-events on any close — a stuck `pointer-events: none`
  // (see the safety-net effect below) freezes the whole page, so it must never
  // depend on the scroll-lock count being perfectly balanced.
  document.body.style.pointerEvents = ''
}

/**
 * Purely React-controlled media query. Starts `false` (desktop) so SSR and the
 * first client render match; flips after mount. No DOM manipulation.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  return isMobile
}

export function ResponsiveSelect({
  name,
  value,
  onValueChange,
  options,
  placeholder,
  title,
  open,
  onOpenChange,
  disabled = false,
  required = false,
  triggerClassName,
  ariaLabel,
}: {
  name: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  required?: boolean
  triggerClassName: string
  ariaLabel: string
}) {
  const isMobile = useIsMobile()

  // Standard scroll lock while the mobile modal is open — not dropdown control.
  // Uses a shared ref count so the body is reliably released once the last
  // modal closes, even across the auto-stepping transitions and auto-search
  // navigation. The cleanup always runs on close AND on unmount.
  useEffect(() => {
    if (!isMobile || !open) return
    lockBodyScroll()
    return () => {
      unlockBodyScroll()
    }
  }, [isMobile, open])

  // Safety net for the auto-stepping flow. Selecting a value closes this select
  // and, 120ms later, programmatically opens the next one. During that rapid
  // close→open race, Base UI / Radix-style popups can miss their own cleanup and
  // leave `pointer-events: none` (and occasionally `overflow: hidden`) stuck on
  // <body>, which freezes the entire page — the user can neither pick nor close.
  // Whenever this select is closed, verify on the next frame that no popup or
  // dialog is still mounted and, if so, forcibly restore body interactivity so
  // the user can never get trapped. This never runs while something is open, so
  // it cannot interfere with a genuinely-open modal.
  useEffect(() => {
    if (open) return
    const frame = requestAnimationFrame(() => {
      const stillOpen = document.querySelector('[role="dialog"], [data-slot="select-content"]')
      if (stillOpen) return
      if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = ''
      if (scrollLockCount === 0 && document.body.style.overflow === 'hidden') document.body.style.overflow = ''
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // Desktop: keep the existing floating Base UI dropdown untouched.
  if (!isMobile) {
    return (
      <Select
        name={name}
        required={required}
        disabled={disabled}
        value={value || null}
        onValueChange={(next) => onValueChange((next as string) ?? '')}
        open={open}
        onOpenChange={onOpenChange}
        modal={false}
      >
        <SelectTrigger className={triggerClassName} aria-label={ariaLabel}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} sideOffset={6}>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value} className="min-h-11 text-base">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Mobile: full-screen bottom drawer, driven by the SAME open/value props.
  const selectedLabel = options.find((item) => item.value === value)?.label

  return (
    <>
      {/* Preserve native form submission (compact form posts to /kereses). */}
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
        className={cn(
          triggerClassName,
          'flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className={cn('flex-1 truncate', !selectedLabel && 'text-muted-foreground')}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            aria-label="Bezárás"
            className="absolute inset-0"
            onClick={() => onOpenChange(false)}
          />
          <div className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-xl font-black text-foreground">{title}</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Bezárás"
                className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-gray-100"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto overscroll-contain">
              {options.map((item) => {
                const active = item.value === value
                return (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => {
                        // Commit the selected value first, then close the modal on
                        // the NEXT tick. Closing in the same synchronous click as
                        // the value update batches both state changes together and
                        // can wedge the modal open (checkmark shows, but it never
                        // closes). The small timeout lets the value commit and the
                        // pointer/focus settle before we tear the overlay down, so
                        // the user is never trapped.
                        onValueChange(item.value)
                        setTimeout(() => onOpenChange(false), 50)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 border-b border-gray-200 px-5 py-6 text-left text-xl font-bold text-foreground last:border-b-0',
                        active && 'bg-accent text-accent-foreground',
                      )}
                    >
                      <span className="flex-1">{item.label}</span>
                      {active && <Check className="size-6 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
