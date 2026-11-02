import type { ReactNode } from 'react'
import { useCapabilities } from '../../hooks/useCapabilities'

// A sacco-admin can still reach a sector-pack route directly by URL even
// though the nav hides it (P24) — this closes that gap so a tenant whose
// sector isn't confirmed/enabled for a pack, or whose module was revoked
// by a superadmin mid-session, can't just navigate straight to it.
export function RequireSectorModule({ module, children }: { module: string; children: ReactNode }) {
  const { isModuleEnabled, isLoading } = useCapabilities()

  if (isLoading) {
    return <div className="p-5 text-sm text-ink-muted">Loading...</div>
  }

  if (!isModuleEnabled(module)) {
    return (
      <div className="p-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          This feature isn&rsquo;t enabled for your SACCO. If you believe it should be, contact platform support.
        </div>
      </div>
    )
  }

  return <>{children}</>
}
