import 'server-only'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'

export const LEGAL_TERMS_VERSION = '2026-08-18'
export const FINANCIAL_RETENTION_YEARS = 8

const TERMS_FINGERPRINT_SOURCE = `mesterek-professional-terms:${LEGAL_TERMS_VERSION}:aszf+privacy+auto-renewal`
export const LEGAL_TERMS_HASH = createHash('sha256').update(TERMS_FINGERPRINT_SOURCE).digest('hex')

export async function legalRequestMetadata() {
  const requestHeaders = await headers()
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  return {
    ipAddress: forwarded || requestHeaders.get('x-real-ip') || null,
    userAgent: requestHeaders.get('user-agent')?.slice(0, 500) || null,
  }
}

export function retentionDeadline(from: Date) {
  const date = new Date(from)
  date.setUTCFullYear(date.getUTCFullYear() + FINANCIAL_RETENTION_YEARS)
  return date
}
