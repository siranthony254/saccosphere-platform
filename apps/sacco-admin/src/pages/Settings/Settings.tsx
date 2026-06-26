import { useSacco } from '../../hooks/useSacco'

export function Settings() {
  const { data: sacco, isLoading } = useSacco()

  return (
    <div className="p-5">
      <div className="text-lg font-semibold text-ink mb-1">Configuration</div>
      <div className="text-xs text-ink-muted mb-6">SACCO configuration & policy</div>

      <div className="grid grid-cols-2 gap-5">
        {/* SACCO Profile */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="font-semibold text-sm text-ink mb-4">SACCO profile</div>
          {isLoading ? (
            <div className="text-sm text-ink-muted py-4">Loading...</div>
          ) : sacco ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-muted mb-1">SACCO Name</div>
                <div className="text-sm text-ink">{sacco.name}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Sector</div>
                <div className="text-sm text-ink">{sacco.sector || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">County</div>
                <div className="text-sm text-ink">{sacco.county || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">SASRA Registration No.</div>
                <div className="text-sm text-ink">{sacco.sasra_reg_no || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Member Count</div>
                <div className="text-sm text-ink">{sacco.member_count?.toLocaleString() || '0'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted py-4">No data available.</div>
          )}
        </div>

        {/* Saccosphere integration */}
        <div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mb-4">
            <div className="font-semibold text-sm text-ink mb-3.5">Saccosphere integration</div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-mint-600" />
                <span className="text-sm text-ink">Connected</span>
              </div>
              <div className="text-xs text-ink-muted">
                Platform fees are calculated automatically based on transaction volume and member count.
              </div>
            </div>
          </div>

          {/* Admin team */}
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
            <div className="font-semibold text-sm text-ink mb-3.5">Admin team</div>
            <div className="text-sm text-ink-muted py-4">
              Admin team management is available through the Super Admin portal.
            </div>
            <button className="mt-3 py-1.5 px-3.5 rounded-lg border border-ink-faint bg-white text-xs cursor-pointer hover:bg-surface-2 transition-colors w-full">
              + Invite admin user
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 text-right">
        <button className="px-6 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors">
          Save changes
        </button>
      </div>
    </div>
  )
}