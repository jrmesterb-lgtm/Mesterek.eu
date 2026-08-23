'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export function AdminCollapsibleSection({ title, eyebrow, description, meta, actions, children, defaultOpen = true, id }: { title: string; eyebrow: string; description?: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode; defaultOpen?: boolean; id: string }) {
  return (
    <details open={defaultOpen} className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 marker:content-none transition [&::-webkit-details-marker]:hidden hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:p-6">
        <div className="min-w-0">
          <p className="font-black text-primary">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3"><h2 id={id} className="text-balance text-2xl font-black text-foreground sm:text-3xl">{title}</h2>{meta}</div>
          {description && <p className="mt-2 text-pretty text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className="mt-1 size-6 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border">
        {actions && <div className="flex justify-end border-b border-border bg-muted/30 px-5 py-3 sm:px-6">{actions}</div>}
        {children}
      </div>
    </details>
  )
}
