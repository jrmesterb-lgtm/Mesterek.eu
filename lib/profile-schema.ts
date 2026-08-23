import { z } from 'zod'
import { CATEGORIES } from '@/lib/constants'

const categoryNames = new Set<string>(CATEGORIES.map((category) => category.name))

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'A név legalább 2 karakter legyen.').max(120),
  billingName: z.string().trim().min(2, 'A vállalkozás neve legalább 2 karakter legyen.').max(160),
  email: z.string().trim().toLowerCase().email('Adjon meg érvényes e-mail-címet.').max(254),
  phone: z.string().trim().min(8, 'A telefonszám legalább 8 karakter legyen.').max(80),
  profession: z.string().refine((value) => categoryNames.has(value), 'Válasszon érvényes szakmát.'),
  description: z.string().trim().min(20, 'A bemutatkozás legalább 20 karakter legyen.').max(1000),
  isEmergency247: z.preprocess((value) => value === 'on', z.boolean()),
  extendedBio: z.string().trim().max(3000).optional(),
  whatsappPhone: z.string().trim().max(80).optional(),
  viberPhone: z.string().trim().max(80).optional(),
  accepted: z.literal('on', { message: 'A feltételek elfogadása szükséges a mentéshez.' }),
}).strict()

export type ProfileActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<keyof z.infer<typeof profileSchema>, string[]>>
}

export const initialProfileActionState: ProfileActionState = { status: 'idle' }
