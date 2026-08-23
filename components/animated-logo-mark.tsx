'use client'

import Image from 'next/image'

export function AnimatedLogoMark() {
  return (
    <span className="logo-intro block size-12 shrink-0 sm:size-14" aria-hidden="true">
      <Image
        src="/images/mesterek-mark.png"
        alt=""
        width={56}
        height={56}
        priority
        className="logo-original-mark size-full object-contain"
      />
    </span>
  )
}
