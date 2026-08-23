'use client'

import { useState, useTransition } from 'react'
import { Check, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { reassignProfessionalCategory, setProfessionalStatus } from '@/app/admin/actions'
import { CATEGORIES } from '@/lib/constants'

export function AdminCategoryReviewActions({ id, currentCategory, status }: { id: number; currentCategory: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function changeStatus(nextStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED') {
    setMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', String(id))
      formData.set('status', nextStatus)
      const result = await setProfessionalStatus(formData)
      if (!result.success) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setMessage({ type: 'success', text: nextStatus === 'APPROVED' ? 'A szakember jóváhagyva.' : 'A státusz frissítve.' })
      router.refresh()
    })
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 lg:w-96">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={pending || status === 'APPROVED'} onClick={() => changeStatus('APPROVED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-black text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}Jóváhagyás</button>
        <button type="button" disabled={pending || status === 'REJECTED'} onClick={() => changeStatus('REJECTED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-4 font-black text-destructive-foreground disabled:opacity-50"><X aria-hidden="true" />Elutasítás</button>
      </div>
      {status === 'REJECTED' && <button type="button" disabled={pending} onClick={() => changeStatus('PENDING_REVIEW')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 font-black text-foreground"><RotateCcw aria-hidden="true" />Vissza ellenőrzésre</button>}
      {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm font-bold ${message.type === 'error' ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}>{message.text}</p>}
      <form action={reassignProfessionalCategory} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`profession-${id}`}>Új kategória</label>
        <select id={`profession-${id}`} name="profession" defaultValue={currentCategory} className="min-h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 font-bold text-foreground">
          {CATEGORIES.map((category) => <option key={category.key} value={category.name}>{category.name}</option>)}
        </select>
        <button type="submit" disabled={pending} className="min-h-11 rounded-xl border border-primary px-4 font-black text-primary disabled:opacity-50">Áthelyezés</button>
      </form>
      <p className="text-xs leading-relaxed text-muted-foreground">Az áthelyezett adatlap ellenőrzésre vár, amíg külön jóvá nem hagyja.</p>
    </div>
  )
}
