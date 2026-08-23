'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ChevronDown, LoaderCircle, Save, Siren, Star, Trash2, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Professional } from '@/lib/db/schema'
import { deleteProfessional, setProfessionalStatus, toggleProfessionalFeature, updateProfessional } from '@/app/admin/actions'
import { CATEGORIES, CITIES } from '@/lib/constants'

export function AdminProfessionalCard({ item, selected = false, onSelectedChange }: { item: Professional; selected?: boolean; onSelectedChange?: () => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function changeStatus() {
    setStatusMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', String(item.id))
      formData.set('status', item.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')
      const result = await setProfessionalStatus(formData)
      if (!result.success) {
        setStatusMessage({ type: 'error', text: result.error })
        return
      }
      setStatusMessage({ type: 'success', text: result.status === 'APPROVED' ? 'A szakember jóváhagyva.' : 'A szakember elutasítva.' })
      router.refresh()
    })
  }

  function toggleFeature(feature: 'featured' | 'sos', enabled: boolean) {
    setStatusMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', String(item.id))
      formData.set('feature', feature)
      formData.set('enabled', String(enabled))
      await toggleProfessionalFeature(formData)
      setStatusMessage({ type: 'success', text: feature === 'featured' ? 'A kiemelt státusz frissítve.' : 'Az SOS-hozzáférés frissítve.' })
      router.refresh()
    })
  }

  const isFeatured = item.membershipTier === 'FEATURED'

  return <article className={`surface ${selected ? 'ring-4 ring-primary/25' : ''}`}>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 items-start gap-4">{onSelectedChange && <label className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-border bg-background" aria-label={`${item.name} kijelölése`}><input type="checkbox" checked={selected} onChange={onSelectedChange} className="size-5 accent-primary" /></label>}<div><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-black text-primary">{item.name}</h2><span className={`rounded-full px-3 py-1 text-sm font-black ${item.status === 'APPROVED' ? 'bg-secondary text-primary' : item.status === 'PENDING_REVIEW' ? 'bg-accent/30 text-foreground' : 'bg-muted text-muted-foreground'}`}>{item.status === 'APPROVED' ? 'Jóváhagyva' : item.status === 'PENDING_REVIEW' ? 'Ellenőrzésre vár' : 'Elutasítva'}</span></div><p className="mt-2 text-lg font-bold">{item.profession} · {item.city}</p><p className="mt-1 text-muted-foreground">{item.email} · {item.phone}</p><p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p></div></div><button type="button" onClick={() => setEditing(!editing)} className="btn-outline shrink-0">Szerkesztés <ChevronDown aria-hidden="true" /></button></div>
    {item.status === 'APPROVED' && <div className="mt-6 grid gap-3 border-t-2 border-border pt-5 sm:grid-cols-2"><button type="button" disabled={pending} aria-pressed={isFeatured} onClick={() => toggleFeature('featured', !isFeatured)} className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border-2 px-5 py-3 font-black transition disabled:opacity-50 ${isFeatured ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-background text-foreground hover:border-accent'}`}><Star className="size-5" aria-hidden="true" />Kiemelt Mester: {isFeatured ? 'Aktív' : 'Inaktív'}</button><button type="button" disabled={pending} aria-pressed={item.isEmergency247} onClick={() => toggleFeature('sos', !item.isEmergency247)} className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border-2 px-5 py-3 font-black transition disabled:opacity-50 ${item.isEmergency247 ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border bg-background text-foreground hover:border-destructive'}`}><Siren className="size-5" aria-hidden="true" />SOS Gyorsszolgálat: {item.isEmergency247 ? 'Aktív' : 'Inaktív'}</button></div>}
    {editing && <form action={updateProfessional} className="mt-6 grid gap-4 border-t-2 border-border pt-6 md:grid-cols-2"><input type="hidden" name="id" value={item.id} /><Field name="name" label="Név" value={item.name} /><Field name="phone" label="Telefonszám" value={item.phone} /><label className="flex flex-col gap-2"><span className="field-label">Település</span><select name="city" className="field-input" defaultValue={item.city}>{!CITIES.includes(item.city) && <option value={item.city}>{item.city} – kézi javítás szükséges</option>}{CITIES.map((city) => <option key={city}>{city}</option>)}</select></label><label className="flex flex-col gap-2"><span className="field-label">Szakma</span><select name="profession" className="field-input" defaultValue={item.profession}>{CATEGORIES.map((cat) => <option key={cat.name}>{cat.name}</option>)}</select></label><label className="flex flex-col gap-2 md:col-span-2"><span className="field-label">Bemutatkozás</span><textarea name="description" className="field-input min-h-28" defaultValue={item.description} /></label><label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-border bg-background px-4 font-black md:col-span-2"><input type="checkbox" name="isEmergency247" defaultChecked={item.isEmergency247} className="size-5 accent-destructive" />SOS 0-24 Gyorsszolgálat</label><button className="btn-primary md:col-span-2"><Save aria-hidden="true" />Módosítások mentése</button></form>}
    <div className="mt-6 flex flex-col gap-3 border-t-2 border-border pt-5 sm:flex-row">
      <button type="button" onClick={changeStatus} disabled={pending} className="btn-outline w-full disabled:cursor-not-allowed disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : item.status === 'APPROVED' ? <UserX aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{pending ? 'Frissítés...' : item.status === 'APPROVED' ? 'Elutasítás' : 'Jóváhagyás'}</button>
      <form action={deleteProfessional} onSubmit={(e) => { if (!window.confirm('Biztosan végleg törli ezt a szakembert?')) e.preventDefault() }}><input type="hidden" name="id" value={item.id} /><button disabled={pending} className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-destructive px-6 py-3 text-lg font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Trash2 aria-hidden="true" />Végleges törlés</button></form>
    </div>
    {statusMessage && <p role={statusMessage.type === 'error' ? 'alert' : 'status'} className={`mt-3 rounded-xl border px-4 py-3 text-sm font-bold ${statusMessage.type === 'error' ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}>{statusMessage.text}</p>}
  </article>
}
function Field({ name, label, value }: { name: string; label: string; value: string }) { return <label className="flex flex-col gap-2"><span className="field-label">{label}</span><input name={name} className="field-input" defaultValue={value} required /></label> }
