import { useState } from 'react'
import { useSaccoSettings } from '../../hooks/useSaccoSettings'

export function Settings() {
  const { data, isLoading, error, isPending, save } = useSaccoSettings()
  const [loanMultiplier, setLoanMultiplier] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [maxRepaymentPeriod, setMaxRepaymentPeriod] = useState('')
  const [minGuarantors, setMinGuarantors] = useState('')

  return (
    <div className="p-5">
      <div className="text-lg font-semibold text-ink mb-1">SACCO settings</div>
      <div className="text-xs text-ink-muted mb-6">SACCO configuration & policy</div>

      <div className="grid grid-cols-2 gap-5">
        {/* SACCO Profile */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="font-semibold text-sm text-ink mb-4">SACCO profile</div>

          {isLoading ? (
            <div className="text-sm text-ink-muted py-4">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600 py-4">Failed to load SACCO settings.</div>
          ) : data?.sacco ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-muted mb-1">SACCO Name</div>
                <div className="text-sm text-ink">{data.sacco.name}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">SASRA licence no.</div>
                <div className="text-sm text-ink">{data.sacco.sasra_reg_no || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Sector</div>
                <div className="text-sm text-ink">{data.sacco.sector || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">County</div>
                <div className="text-sm text-ink">{data.sacco.county || '—'}</div>
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
                <span className="text-sm text-ink">Active & live</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-muted">API connection</span>
                <span className="text-xs text-mint-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-muted">Member data sync</span>
                <span className="text-xs text-ink font-medium">Real-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-muted">Monthly platform fee</span>
                <span className="text-xs text-ink font-medium">KES 20,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-muted">Transaction fee rate</span>
                <span className="text-xs text-ink font-medium">1.0% per txn</span>
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

      {/* Loan Policy */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
        <div className="font-semibold text-sm text-ink mb-4">Loan policy</div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-ink-muted mb-1">Max loan multiplier (× savings)</div>
            <input
              type="number"
              className="w-full p-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={loanMultiplier || data?.settings?.loan_multiplier || ''}
              onChange={e => setLoanMultiplier(e.target.value)}
              placeholder="3"
            />
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">Default interest rate (%)</div>
            <input
              type="number"
              className="w-full p-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={interestRate || data?.settings?.interest_rate || ''}
              onChange={e => setInterestRate(e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">Max repayment period (months)</div>
            <input
              type="number"
              className="w-full p-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={maxRepaymentPeriod || data?.settings?.max_repayment_period || ''}
              onChange={e => setMaxRepaymentPeriod(e.target.value)}
              placeholder="48"
            />
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">Min guarantors required</div>
            <input
              type="number"
              className="w-full p-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={minGuarantors || data?.settings?.min_guarantors || ''}
              onChange={e => setMinGuarantors(e.target.value)}
              placeholder="2"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 text-right">
        <button
          onClick={() => save()}
          disabled={isPending}
          className="px-6 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}