import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { externalPlaceLeads } from '@/lib/db/schema'

export async function recordExternalPlaceLeads(placeIds: string[], trade: string, town: string) {
  const uniqueIds = [...new Set(placeIds)].filter(Boolean)
  if (uniqueIds.length === 0) return

  await db.insert(externalPlaceLeads).values(uniqueIds.map((placeId) => ({
    placeId,
    searchedTrade: trade,
    searchedTown: town,
  }))).onConflictDoUpdate({
    target: externalPlaceLeads.placeId,
    set: {
      searchedTrade: trade,
      searchedTown: town,
      lastSeenAt: sql`now()`,
    },
  })
}
