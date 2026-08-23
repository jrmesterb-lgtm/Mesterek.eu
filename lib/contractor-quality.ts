const BLACKLISTED_KEYWORDS = ['kfc', 'gumis', 'kombinat', 'etterem', 'zrt.'] as const

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU')
}

export function hasBlacklistedContractorKeyword(...values: Array<string | null | undefined>) {
  const text = normalize(values.filter(Boolean).join(' '))
  return BLACKLISTED_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function safeContractorStatus(requested: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED', ...values: Array<string | null | undefined>) {
  return requested === 'APPROVED' && hasBlacklistedContractorKeyword(...values) ? 'PENDING_REVIEW' : requested
}
