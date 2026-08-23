export type PremiumProfile = {
  membershipTier: string
}

export function hasActivePremium(profile: PremiumProfile) {
  return profile.membershipTier === 'FEATURED'
}
