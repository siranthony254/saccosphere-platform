/**
 * MockModeBanner
 *
 * Shows a banner at the top of the app when any mock flag is enabled.
 * Helps developers know immediately that they are looking at mock data.
 * Remove from production builds automatically via MOCK flags being false.
 */

import React from 'react'
import { isAnyMockEnabled } from '@saccosphere/config'

interface MockModeBannerProps {
  /** Extra class names for the container — for positioning adjustments */
  className?: string
}

export function MockModeBanner({ className = '' }: MockModeBannerProps) {
  if (!isAnyMockEnabled()) return null

  return (
    <div
      className={`
        flex items-center justify-center gap-2
        bg-amber-400 text-amber-900
        px-4 py-1.5 text-xs font-semibold
        ${className}
      `}
      role="banner"
    >
      <span>🟡</span>
      <span>MOCK MODE — No real API calls. Set VITE_MOCK_*=false to use the real backend.</span>
    </div>
  )
}
