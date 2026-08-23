'use client'

import { useActionState } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { deleteProfessionalAccount, type DeleteAccountState } from '@/app/dashboard/actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const initialState: DeleteAccountState = { status: 'idle' }

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteProfessionalAccount, initialState)
  return (
    <form action={action} className="flex flex-col gap-5">
      <Alert variant="destructive">
        <Trash2 />
        <AlertTitle>Ez a művelet nem vonható vissza</AlertTitle>
        <AlertDescription>A nyilvános profil, belépési adatok, érdeklődések, feltöltött képek és minden nem kötelező személyes adat véglegesen törlődik vagy anonimizálódik. Kizárólag a jogszabály által előírt minimális számlázási bizonylatadatokat őrizzük meg 8 évig.</AlertDescription>
      </Alert>
      {state.status === 'error' && <p role="alert" className="font-bold text-destructive">{state.message}</p>}
      <Field>
        <FieldLabel htmlFor="delete-confirmation">Megerősítő szöveg</FieldLabel>
        <Input id="delete-confirmation" name="confirmation" autoComplete="off" placeholder="FIÓK TÖRLÉSE" required />
        <FieldDescription>Írja be pontosan: FIÓK TÖRLÉSE</FieldDescription>
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm leading-relaxed">
        <input name="acknowledged" type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" required />
        <span>Megértettem, hogy a személyes és működési adataim törlődnek vagy anonimizálódnak, az aktív előfizetésem pedig azonnal megszűnik. A kötelező minimális számviteli adatokat 8 évig megőrizzük.</span>
      </label>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
        {pending ? 'Fiók törlése…' : 'Fiók törlése'}
      </Button>
    </form>
  )
}
