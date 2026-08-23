import { get } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { professionalPortfolioImages, professionals } from '@/lib/db/schema'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) return new NextResponse('Not found', { status: 404 })
  const [image] = await db.select({ pathname: professionalPortfolioImages.blobPathname }).from(professionalPortfolioImages).innerJoin(professionals, eq(professionals.id, professionalPortfolioImages.professionalId)).where(and(eq(professionalPortfolioImages.id, id), eq(professionals.status, 'APPROVED'), eq(professionals.membershipTier, 'FEATURED'))).limit(1)
  if (!image) return new NextResponse('Not found', { status: 404 })
  const result = await get(image.pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') || undefined })
  if (!result) return new NextResponse('Not found', { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'public, max-age=0, must-revalidate' } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, ETag: result.blob.etag, 'Cache-Control': 'public, max-age=3600, must-revalidate', 'X-Content-Type-Options': 'nosniff' } })
}
