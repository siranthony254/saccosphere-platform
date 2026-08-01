import { useState, useEffect } from 'react'
import { useSaccoSettings } from '../../hooks/useSaccoSettings'

export function Settings() {
  const { data, isLoading, error, isPending, save } = useSaccoSettings()

  // Form state — mirrors every field the backend SaccoSettings model exposes
  const [formData, setFormData] = useState({
    min_loan_amount: '',
    max_loan_amount: '',
    loan_multiplier: '',
    requires_guarantor: true,
    guarantor_type_allowed: 'BOTH',
    registration_fee: '',
    monthly_contribution_amount: '',
    liquidity_threshold_percentage: '',
    sms_daily_limit: '',
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
        liquidity_threshold_percentage: String(data.settings.liquidity_threshold_percentage ?? 80),
        sms_daily_limit: String(data.settings.sms_daily_limit ?? 1000),
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
      liquidity_threshold_percentage: Number(formData.liquidity_threshold_percentage),
      sms_daily_limit: Number(formData.sms_daily_limit),
    })
  }

  const field = (
    label: string,
    key: keyof typeof formData,
    type: 'number' | 'text' = 'number',
    hint?: string
  ) => (
    <div>
      <label className="text-xs text-ink-muted mb-1.5 block">{label}</label>
      <input
        type={type}
        className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
        value={formData[key] as string}
        onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
      />
      {hint && <p className="text-[10px] text-ink-faint mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="p-5">
      <div className="text-lg font-semibold text-ink mb-1">SACCO settings</div>
      <div className="text-xs text-ink-muted mb-6">SACCO configuration &amp; policy</div>

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
            {field('Registration fee (KES)', 'registration_fee')}
            {field('Default monthly contribution (KES)', 'monthly_contribution_amount')}
          </div>
        </div>
      </div>

      {/* Loan Policy */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
        <div className="font-semibold text-sm text-ink mb-4 border-b border-surface-3 pb-3">Loan configuration</div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {field('Max loan multiplier (× savings)', 'loan_multiplier')}
          {field('Min loan amount (KES)', 'min_loan_amount')}
          {field('Max loan amount (KES)', 'max_loan_amount')}
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
              <option value="BOTH">Both Internal &amp; External</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operational Limits — sms_daily_limit + liquidity_threshold_percentage */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
        <div className="font-semibold text-sm text-ink mb-1 border-b border-surface-3 pb-3">Operational limits</div>
        <p className="text-xs text-ink-muted mb-4">Controls cost and risk guardrails for the SACCO.</p>

        <div className="grid grid-cols-2 gap-6">
          {field(
            'SMS daily send limit',
            'sms_daily_limit',
            'number',
            'Maximum number of SMS messages that can be sent in a single day. Prevents runaway costs.',
          )}
          {field(
            'Liquidity utilisation warning threshold (%)',
            'liquidity_threshold_percentage',
            'number',
            'A liquidity warning fires when loan disbursements exceed this percentage of total savings. Default: 80%.',
          )}
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


