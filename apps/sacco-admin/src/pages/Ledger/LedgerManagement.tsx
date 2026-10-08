export function LedgerManagement() {
  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-xl font-bold text-ink">General Ledger</div>
        <div className="text-xs text-ink-muted">
          SACCO-wide ledger management will appear here once the deployed backend exposes admin ledger routes.
        </div>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 shadow-sm space-y-3">
        <div className="font-semibold text-base text-ink">Ledger API unavailable for SACCO admin</div>
        <div className="text-sm text-ink-muted max-w-3xl">
          The deployed backend currently returns 400/404 for the ledger endpoints this admin page was calling.
          The simple <span className="font-mono text-xs">/api/v1/ledger/*</span> endpoints are member-statement
          endpoints that require an approved membership for the logged-in user, while the admin GL routes are not
          available on the Railway deployment yet. This page now avoids those calls so the app stays clean while the
          backend catches up.
        </div>
      </div>
    </div>
  )
}