export function ApprovalsList() {
  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-xl font-bold text-ink">Maker-Checker Governance & Approvals</div>
        <div className="text-xs text-ink-muted">
          Approval queues and support access grants will appear here once the backend approvals module is deployed.
        </div>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 shadow-sm">
        <div className="font-semibold text-base text-ink mb-2">Approvals API unavailable</div>
        <div className="text-sm text-ink-muted max-w-3xl">
          The deployed backend is returning 404 for the approvals routes, so this page is intentionally not making
          requests to <span className="font-mono text-xs">/api/v1/approvals/*</span>. Deploy the backend approvals
          app routes, then re-enable this page's live queries.
        </div>
      </div>
    </div>
  )
}