import type { ReactNode } from 'react'
import { useCapabilities } from '../../hooks/useCapabilities'

// Inline counterpart to auth/RequireSectorModule — for one tab/section
// within a sector-pack page whose module is a *different*, independently
// overridable P24 module from the one gating the page itself. A
// superadmin can turn an individual sub-module off for a tenant without
// affecting the rest of the pack, so that tab checks its own module
// rather than assuming the page-level gate already covers it.
export function ModuleGate({ module, moduleName, children }: { module: string; moduleName: string; children: ReactNode }) {
  const { isModuleEnabled, isLoading } = useCapabilities()

  if (isLoading) {
    return <div className="text-sm text-ink-muted p-4">Loading...</div>
  }

  if (!isModuleEnabled(module)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        {moduleName} isn&rsquo;t enabled for your SACCO. If you believe it should be, contact platform support.
      </div>
    )
  }

  return <>{children}</>
}
