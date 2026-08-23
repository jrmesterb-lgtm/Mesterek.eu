'use server'

import { db } from '@/lib/db'
import { deletionRequests } from '@/lib/db/schema'
import { limitPublic, PUBLIC_RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

export type DeletionRequestState = { success?: boolean; error?: string }

export async function submitDeletionRequest(
  _previousState: DeletionRequestState,
  formData: FormData,
): Promise<DeletionRequestState> {
  const rateLimit = await limitPublic('deletion')
  if (!rateLimit.success) return { error: PUBLIC_RATE_LIMIT_MESSAGE }

  const professionalName = String(formData.get('professionalName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLocaleLowerCase('hu-HU')
  const botField = String(formData.get('botField') ?? '').trim()

  if (botField) {
    console.warn('[v0] Bot submission detected on deletion request form')
    return { success: true }
  }

  if (professionalName.length < 2 || professionalName.length > 160) {
    return { error: 'Kérjük, adja meg a szakember vagy a cég nevét.' }
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Kérjük, adjon meg egy érvényes e-mail-címet.' }
  }

  await db.insert(deletionRequests).values({ professionalName, email })
  return { success: true }
}
