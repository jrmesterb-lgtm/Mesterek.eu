import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/dashboard/', '/api/', '/szakember/'] }, sitemap: 'https://mesterek.eu/sitemap.xml' } }
