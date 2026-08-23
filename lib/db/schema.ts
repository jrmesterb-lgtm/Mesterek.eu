import { boolean, index, integer, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  twoFactorEnabled: boolean('twoFactorEnabled').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [index('session_user_id_idx').on(table.userId)])

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'), password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('account_user_id_idx').on(table.userId), uniqueIndex('account_provider_account_idx').on(table.providerId, table.accountId)])

export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('verification_identifier_idx').on(table.identifier), index('verification_expiry_idx').on(table.expiresAt)])

export const twoFactor = pgTable('twoFactor', {
  id: text('id').primaryKey(), secret: text('secret').notNull(), backupCodes: text('backupCodes').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  verified: boolean('verified').notNull().default(true),
  failedVerificationCount: integer('failedVerificationCount').notNull().default(0),
  lockedUntil: timestamp('lockedUntil', { withTimezone: true }),
}, (table) => [uniqueIndex('two_factor_user_id_idx').on(table.userId)])

export const contractorStatus = pgEnum('contractor_status', ['APPROVED', 'PENDING_REVIEW', 'REJECTED'])

export const professionals = pgTable('professionals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone').notNull(),
  city: text('city').notNull(),
  county: text('county'),
  query: text('query'),
  site: text('site'),
  fullAddress: text('full_address'),
  profession: text('profession').notNull(),
  description: text('description').notNull().default(''),
  taxType: text('tax_type').notNull(),
  taxNumber: text('tax_number').notNull(),
  billingName: text('billing_name').notNull(),
  billingAddress: text('billing_address').notNull(),
  zipCode: text('zip_code'),
  address: text('address'),
  website: text('website'),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  sourceKey: text('source_key').unique(),
  status: contractorStatus('status').notNull().default('PENDING_REVIEW'),
  isEmergency247: boolean('is_emergency_247').notNull().default(false),
  isAvailable: boolean('is_available').notNull().default(true),
  availabilityExplicitlySet: boolean('availability_explicitly_set').notNull().default(false),
  membershipTier: text('membership_tier').notNull().default('FREE'),
  featuredBillingInterval: text('featured_billing_interval'),
  featuredUntil: timestamp('featured_until', { withTimezone: true }),
  extendedBio: text('extended_bio'),
  whatsappPhone: text('whatsapp_phone'),
  viberPhone: text('viber_phone'),
  dashboardToken: text('dashboard_token').unique(),
  userId: text('user_id').unique(),
  loginAttempts: integer('login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  phoneClicks: integer('phone_clicks').notNull().default(0),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeSubscriptionStatus: text('stripe_subscription_status'),
  stripeTrialEnd: timestamp('stripe_trial_end', { withTimezone: true }),
  stripeSessionId: text('stripe_session_id'),
  importedAt: timestamp('imported_at', { withTimezone: true }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  deletionTokenHash: text('deletion_token_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  contractorId: integer('contractor_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  interactionType: text('interaction_type').notNull(),
})

export const professionalReviews = pgTable('professional_reviews', {
  id: serial('id').primaryKey(),
  professionalId: integer('professional_id').notNull(),
  clientName: text('client_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  visitorHash: text('visitor_hash'),
  verifiedContact: boolean('verified_contact').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sosRequests = pgTable('sos_requests', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  city: text('city').notNull(),
  issue: text('issue').notNull(),
  status: text('status').notNull().default('PENDING'),
  dispatchCount: integer('dispatch_count').notNull().default(0),
  providerError: text('provider_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
})

export const contractorInquiries = pgTable('contractor_inquiries', {
  id: serial('id').primaryKey(),
  professionalId: integer('professional_id').notNull(),
  clientName: text('client_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('PENDING'),
  providerError: text('provider_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
})

export const phoneLeadEvents = pgTable('phone_lead_events', {
  id: serial('id').primaryKey(),
  professionalId: integer('professional_id').notNull(),
  action: text('action').notNull(),
  visitorHash: text('visitor_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const professionalPortfolioImages = pgTable('professional_portfolio_images', {
  id: serial('id').primaryKey(),
  professionalId: integer('professional_id').notNull(),
  blobPathname: text('blob_pathname').notNull().unique(),
  altText: text('alt_text').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const legalConsentEvents = pgTable('legal_consent_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  professionalId: integer('professional_id'),
  eventType: text('event_type').notNull(),
  termsVersion: text('terms_version').notNull(),
  termsHash: text('terms_hash').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  anonymizedAt: timestamp('anonymized_at', { withTimezone: true }),
})

export const stripeEventReceipts = pgTable('stripe_event_receipts', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
})

export const billingLedger = pgTable('billing_ledger', {
  id: serial('id').primaryKey(),
  professionalId: integer('professional_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeInvoiceId: text('stripe_invoice_id').notNull().unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  amountDue: integer('amount_due').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  invoiceNumber: text('invoice_number'),
  invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull(),
  hostedInvoiceUrl: text('hosted_invoice_url'),
  invoicePdfUrl: text('invoice_pdf_url'),
  retainUntil: timestamp('retain_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const deletionRequests = pgTable('deletion_requests', {
  id: serial('id').primaryKey(),
  professionalName: text('professional_name').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const externalPlaceLeads = pgTable('external_place_leads', {
  id: serial('id').primaryKey(),
  placeId: text('place_id').notNull().unique(),
  searchedTrade: text('searched_trade').notNull(),
  searchedTown: text('searched_town').notNull(),
  claimStatus: text('claim_status').notNull().default('unclaimed'),
  outreachStatus: text('outreach_status').notNull().default('new'),
  outreachNotes: text('outreach_notes'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adminOtpChallenges = pgTable('admin_otp_challenges', {
  id: uuid('id').primaryKey(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Professional = typeof professionals.$inferSelect
export type NewProfessional = typeof professionals.$inferInsert
export type ProfessionalReview = typeof professionalReviews.$inferSelect
export type NewProfessionalReview = typeof professionalReviews.$inferInsert
export type ExternalPlaceLead = typeof externalPlaceLeads.$inferSelect
