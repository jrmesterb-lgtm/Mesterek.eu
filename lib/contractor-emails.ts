import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { professionals } from '@/lib/db/schema'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createContractorDeletionUrl(contractorId: number, origin: string) {
  const token = randomBytes(32).toString('base64url')
  await db
    .update(professionals)
    .set({ deletionTokenHash: hashToken(token), updatedAt: new Date() })
    .where(eq(professionals.id, contractorId))

  return new URL(`/adatok-torlese/${token}`, origin).toString()
}

export async function buildContractorEmail({
  contractorId,
  origin,
  subject,
  message,
}: {
  contractorId: number
  origin: string
  subject: string
  message: string
}) {
  const deletionUrl = await createContractorDeletionUrl(contractorId, origin)
  const escapedMessage = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')

  return {
    subject,
    text: `${message}\n\nNem szeretné, hogy adatait kezeljük? Profil törlése: ${deletionUrl}`,
    html: `<p>${escapedMessage}</p><hr><p><strong>Adatainak törlése:</strong> <a href="${deletionUrl}">Profilom végleges törlése</a></p>`,
    deletionUrl,
  }
}

export { hashToken }
