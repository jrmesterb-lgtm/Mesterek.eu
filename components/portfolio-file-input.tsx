'use client'

import { useId, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED = 'image/jpeg,image/png,image/webp'

/**
 * Branded, always-Hungarian replacement for the native file picker.
 *
 * The native input stays in the DOM (sr-only, not `hidden`) so that the label
 * click-through, the `required` constraint validation and the server action's
 * FormData all keep working without JavaScript.
 */
export function PortfolioFileInput({ disabled = false }: { disabled?: boolean }) {
  const inputId = useId()
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <input
        id={inputId}
        name="file"
        type="file"
        accept={ACCEPTED}
        required
        disabled={disabled}
        className="peer sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary px-4 py-8 text-center transition-colors',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary hover:bg-accent/20',
        )}
      >
        <span className="flex items-center gap-2 text-base font-black text-primary">
          <ImagePlus className="size-5 shrink-0" aria-hidden="true" />
          Kép kiválasztása
        </span>
        <span className={cn('max-w-full truncate text-sm', fileName ? 'font-bold text-foreground' : 'text-muted-foreground')}>
          {fileName ?? 'JPG, PNG vagy WebP'}
        </span>
      </label>
    </div>
  )
}
