import 'server-only'
import { createHash } from 'node:crypto'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { billingLedger, legalConsentEvents, phoneLeadEvents, professionalPortfolioImages, professionals, user } from '@/lib/db/schema'
import { requireProfessional } from '@/lib/professional-auth'

export function hashDashboardToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function dashboardForProfessional(professional: typeof professionals.$inferSelect | undefined) {
  if (!professional) return null
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  const [[metric], gallery, [identity], invoices, [latestConsent]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(phoneLeadEvents).where(and(eq(phoneLeadEvents.professionalId, professional.id), gte(phoneLeadEvents.createdAt, monthStart))),
    db.select().from(professionalPortfolioImages).where(eq(professionalPortfolioImages.professionalId, professional.id)).orderBy(professionalPortfolioImages.sortOrder),
    professional.userId
      ? db.select({ emailVerified: user.emailVerified, twoFactorEnabled: user.twoFactorEnabled }).from(user).where(eq(user.id, professional.userId)).limit(1)
      : Promise.resolve([]),
    db.select().from(billingLedger).where(eq(billingLedger.professionalId, professional.id)).orderBy(desc(billingLedger.invoiceDate)).limit(12),
    db.select({ termsVersion: legalConsentEvents.termsVersion, acceptedAt: legalConsentEvents.acceptedAt })
      .from(legalConsentEvents).where(eq(legalConsentEvents.professionalId, professional.id)).orderBy(desc(legalConsentEvents.acceptedAt)).limit(1),
  ])
  return { professional, monthlyPhoneClicks: metric?.count ?? 0, gallery, identity: identity ?? null, invoices, latestConsent: latestConsent ?? null }
}

export async function getContractorDashboard(token: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null
  const [professional] = await db.select().from(professionals).where(eq(professionals.dashboardToken, hashDashboardToken(token))).limit(1)
  return dashboardForProfessional(professional)
}

export async function getContractorDashboardById(id: number) {
  const [professional] = await db.select().from(professionals).where(eq(professionals.id, id)).limit(1)
  return dashboardForProfessional(professional)
}

export async function getAuthenticatedContractorDashboard() {
  const { professional } = await requireProfessional()
  return dashboardForProfessional(professional)
}
