import Image from 'next/image'
import React from 'react'

/**
 * P2-T7 §5 — admin branding. The files are the brand SVGs already served from `public/brand/`
 * (copies of `design/assets/logo/`). `unoptimized`: they are static SVGs, served as they are.
 */
export function AdminLogo(): React.ReactElement {
  return (
    <Image
      src="/brand/full-navy.svg"
      alt="Al Jazira for Imdad Smart Co."
      width={199}
      height={58}
      unoptimized
      priority
      className="admin-brand-logo"
    />
  )
}

export function AdminIcon(): React.ReactElement {
  return (
    <Image
      src="/brand/icon-navy.svg"
      alt="Al Jazira"
      width={29}
      height={28}
      unoptimized
      className="admin-brand-icon"
    />
  )
}
