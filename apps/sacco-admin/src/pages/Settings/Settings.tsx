import { useState, useEffect } from 'react'
import { useSaccoSettings } from '../../hooks/useSaccoSettings'

export function Settings() {
  const { data, isLoading, error, isPending, save } = useSaccoSettings()

  // Form state
  const [formData, setFormData] = useState({
    min_loan_amount: '',
    max_loan_amount: '',
    loan_multiplier: '',
    requires_guarantor: true,
    guarantor_type_allowed: 'BOTH',
    registration_fee: '',
    monthly_contribution_amount: '',
  })

  // Sync initial data to form
  useEffect(() => {
    if (data?.settings) {
      setFormData({
        min_loan_amount: String(data.settings.min_loan_amount ?? 1000),
        max_loan_amount: String(data.settings.max_loan_amount ?? 500000),
        loan_multiplier: String(data.settings.loan_multiplier ?? 3),
        requires_guarantor: data.settings.requires_guarantor ?? true,
        guarantor_type_allowed: data.settings.guarantor_type_allowed ?? 'BOTH',
        registration_fee: String(data.settings.registration_fee ?? 0),
        monthly_contribution_amount: String(data.settings.monthly_contribution_amount ?? 0),
      })
    }
  }, [data])

  const handleSave = () => {
    save({
      ...formData,
      min_loan_amount: Number(formData.min_loan_amount),
      max_loan_amount: Number(formData.max_loan_amount),
      loan_multiplier: Number(formData.loan_multiplier),
      registration_fee: Number(formData.registration_fee),
      monthly_contribution_amount: Number(formData.monthly_contribution_amount),
    })
  }

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-ink-muted mb-1">Sector</div>
                  <div className="text-sm text-ink">{data.sacco.sector || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-muted mb-1">County</div>
                  <div className="text-sm text-ink">{data.sacco.county || '—'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted py-4">No data available.</div>
          )}
        </div>

        {/* Membership Policy */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="font-semibold text-sm text-ink mb-4">Membership policy</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-ink-muted mb-1.5 block">Registration fee (KES)</label>
              <input
                type="number"
                className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                value={formData.registration_fee}
                onChange={e => setFormData(prev => ({ ...prev, registration_fee: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1.5 block">Default monthly contribution (KES)</label>
              <input
                type="number"
                className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                value={formData.monthly_contribution_amount}
                onChange={e => setFormData(prev => ({ ...prev, monthly_contribution_amount: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Loan Policy */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
        <div className="font-semibold text-sm text-ink mb-4 border-b border-surface-3 pb-3">Loan configuration</div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-xs text-ink-muted mb-1.5 block">Max loan multiplier (× savings)</label>
            <input
              type="number"
              className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={formData.loan_multiplier}
              onChange={e => setFormData(prev => ({ ...prev, loan_multiplier: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1.5 block">Min loan amount (KES)</label>
            <input
              type="number"
              className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={formData.min_loan_amount}
              onChange={e => setFormData(prev => ({ ...prev, min_loan_amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1.5 block">Max loan amount (KES)</label>
            <input
              type="number"
              className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={formData.max_loan_amount}
              onChange={e => setFormData(prev => ({ ...prev, max_loan_amount: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 bg-surface-2 rounded-xl">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="req-guarantor"
              className="w-4 h-4 rounded border-ink-faint text-violet-600 focus:ring-violet-500"
              checked={formData.requires_guarantor}
              onChange={e => setFormData(prev => ({ ...prev, requires_guarantor: e.target.checked }))}
            />
            <label htmlFor="req-guarantor" className="text-sm font-medium text-ink">Requires guarantors for all loans</label>
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1.5 block">Guarantor types allowed</label>
            <select
              className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
              value={formData.guarantor_type_allowed}
              onChange={e => setFormData(prev => ({ ...prev, guarantor_type_allowed: e.target.value }))}
            >
              <option value="MEMBER_ONLY">Internal members only</option>
              <option value="EXTERNAL_ONLY">External only</option>
              <option value="BOTH">Both Internal & External</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-xs text-ink-faint">Last updated: {data?.settings?.updated_at ? new Date(data.settings.updated_at as any).toLocaleString() : 'Never'}</p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-8 py-2.5 rounded-lg border-none bg-mint-600 text-white text-sm font-bold cursor-pointer hover:bg-mint-700 transition-all shadow-md active:scale-95 disabled:opacity-60"
        >
          {isPending ? 'Updating settings...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}
