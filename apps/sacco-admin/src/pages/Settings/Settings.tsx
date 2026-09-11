import { useState, useEffect } from 'react'
import { ThemePicker } from '@saccosphere/ui'
import { useSaccoSettings } from '../../hooks/useSaccoSettings'
import { useAuthStore } from '../../store/useAuthStore'
import {
  useMemberFieldDefinitions,
  useCreateMemberFieldDefinition,
  useDeleteMemberFieldDefinition,
} from '../../hooks/useMemberFields'
import {
  useSavingsTypesList,
  useCreateSavingsType,
  useUpdateSavingsType,
  useDeleteSavingsType,
} from '../../hooks/useSavingsTypes'

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'FILE'] as const

const EMPTY_ST = {
  name: '',
  description: '',
  interest_rate: '',
  minimum_contribution: '',
  is_active: true,
  allows_multiple_accounts: false,
}

function SavingsTypesCard() {
  const { user } = useAuthStore()
  const saccoId = user?.sacco_id ?? undefined
  const { data: types, isLoading, error } = useSavingsTypesList(saccoId)
  const create = useCreateSavingsType()
  const update = useUpdateSavingsType()
  const remove = useDeleteSavingsType()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_ST })
  const [formError, setFormError] = useState<string | null>(null)

  const reset = () => {
    setEditingId(null)
    setForm({ ...EMPTY_ST })
    setFormError(null)
  }

  const startEdit = (t: {
    id: string
    name: string
    description: string
    interest_rate: number
    minimum_contribution: number
    is_active: boolean
    allows_multiple_accounts: boolean
  }) => {
    setEditingId(t.id)
    setFormError(null)
    setForm({
      name: t.name,
      description: t.description,
      interest_rate: String(t.interest_rate ?? ''),
      minimum_contribution: String(t.minimum_contribution ?? ''),
      is_active: t.is_active,
      allows_multiple_accounts: t.allows_multiple_accounts,
    })
  }

  const handleSubmit = () => {
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      interest_rate: Number(form.interest_rate || 0),
      minimum_contribution: Number(form.minimum_contribution || 0),
      is_active: form.is_active,
      allows_multiple_accounts: form.allows_multiple_accounts,
    }
    const onError = (err: any) => setFormError(err?.message || 'Save failed.')
    if (editingId) {
      update.mutate({ id: editingId, data: payload }, { onSuccess: reset, onError })
    } else {
      create.mutate(payload, { onSuccess: reset, onError })
    }
  }

  const busy = create.isPending || update.isPending

  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
      <div className="font-semibold text-sm text-ink mb-1 border-b border-surface-3 pb-3">Savings products</div>
      <p className="text-xs text-ink-muted mb-4">
        The savings account types members can hold in this SACCO (BOSA, FOSA, etc.), with their
        interest rate and minimum contribution.
      </p>

      {isLoading ? (
        <div className="text-sm text-ink-muted py-2">Loading savings products…</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-2">
          Failed to load savings products{(error as { status?: number })?.status === 403 ? ' (SACCO-admin role required).' : '.'}
        </div>
      ) : (types ?? []).length === 0 ? (
        <div className="text-sm text-ink-muted py-2">No savings products defined.</div>
      ) : (
        <div className="space-y-2 mb-4">
          {(types ?? []).map(t => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
              <div>
                <span className="text-sm font-medium text-ink">{t.name}</span>
                {!t.is_active && <span className="ml-2 text-[10px] text-ink-faint">inactive</span>}
                {t.allows_multiple_accounts && (
                  <span className="ml-1.5 text-[10px] text-violet-700">multi-account</span>
                )}
                <span className="ml-2 text-[10px] text-ink-faint">
                  {t.interest_rate}% · min KES {Number(t.minimum_contribution).toLocaleString()}
                </span>
                {t.description && <div className="text-[10px] text-ink-faint mt-0.5">{t.description}</div>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => update.mutate({ id: t.id, data: { is_active: !t.is_active } })}
                  disabled={update.isPending}
                  className="text-[11px] text-ink-muted hover:text-ink font-medium disabled:opacity-50"
                >
                  {t.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => startEdit(t)}
                  className="text-[11px] text-violet-700 hover:text-violet-800 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove.mutate(t.id)}
                  disabled={remove.isPending}
                  className="text-[11px] text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-surface-3 pt-4">
        <div className="text-xs font-semibold text-ink mb-2">
          {editingId ? 'Edit savings product' : 'Add a savings product'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Name</label>
            <input
              className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. FOSA"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Description</label>
            <input
              className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Interest rate (%)</label>
            <input
              type="number"
              className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={form.interest_rate}
              onChange={e => setForm(p => ({ ...p, interest_rate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Minimum contribution (KES)</label>
            <input
              type="number"
              className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              value={form.minimum_contribution}
              onChange={e => setForm(p => ({ ...p, minimum_contribution: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex items-center gap-5 mt-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            />
            Active
          </label>
          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={form.allows_multiple_accounts}
              onChange={e => setForm(p => ({ ...p, allows_multiple_accounts: e.target.checked }))}
            />
            Allow multiple accounts per member
          </label>
        </div>

        {formError && <p className="text-[11px] text-red-600 mt-2">{formError}</p>}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="px-5 py-2 rounded-lg border-none bg-violet-600 text-white text-sm font-semibold cursor-pointer hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button onClick={reset} className="text-[11px] text-ink-muted hover:text-ink">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ThemeSettingsCard() {
  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
      <div className="font-semibold text-sm text-ink mb-1">Background theme</div>
      <p className="text-xs text-ink-muted mb-4">
        Applies instantly across the whole portal — every screen shares this one setting.
      </p>
      <ThemePicker />
    </div>
  )
}

function MemberFieldsCard() {
  const { data: fields, isLoading, error } = useMemberFieldDefinitions()
  const create = useCreateMemberFieldDefinition()
  const remove = useDeleteMemberFieldDefinition()

  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState<(typeof FIELD_TYPES)[number]>('TEXT')
  const [required, setRequired] = useState(true)
  const [optionsText, setOptionsText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleAdd = () => {
    setFormError(null)
    if (!label.trim()) {
      setFormError('Label is required.')
      return
    }
    const options =
      fieldType === 'SELECT'
        ? optionsText.split(',').map(o => o.trim()).filter(Boolean)
        : null
    if (fieldType === 'SELECT' && (!options || options.length === 0)) {
      setFormError('A SELECT field needs at least one comma-separated option.')
      return
    }
    create.mutate(
      { label: label.trim(), field_type: fieldType, is_required: required, options },
      {
        onSuccess: () => {
          setLabel('')
          setFieldType('TEXT')
          setRequired(true)
          setOptionsText('')
        },
        onError: (err: any) => setFormError(err?.message || 'Failed to add field.'),
      },
    )
  }

  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
      <div className="font-semibold text-sm text-ink mb-1 border-b border-surface-3 pb-3">Custom member fields</div>
      <p className="text-xs text-ink-muted mb-4">
        Extra fields collected on member profiles for this SACCO, in display order.
      </p>

      {isLoading ? (
        <div className="text-sm text-ink-muted py-2">Loading fields…</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-2">Failed to load custom fields.</div>
      ) : (fields ?? []).length === 0 ? (
        <div className="text-sm text-ink-muted py-2">No custom fields defined.</div>
      ) : (
        <div className="space-y-2 mb-4">
          {(fields ?? []).map(f => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
              <div>
                <span className="text-sm font-medium text-ink">{f.label}</span>
                <span className="ml-2 text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-full">
                  {f.field_type}
                </span>
                {f.is_required && <span className="ml-1.5 text-[10px] text-amber-700">required</span>}
                {f.field_type === 'SELECT' && f.options && (
                  <span className="ml-2 text-[10px] text-ink-faint">{f.options.join(', ')}</span>
                )}
              </div>
              <button
                onClick={() => remove.mutate(f.id)}
                disabled={remove.isPending}
                className="text-[11px] text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end border-t border-surface-3 pt-4">
        <div>
          <label className="text-xs text-ink-muted mb-1 block">New field label</label>
          <input
            className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Payroll number"
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">Type</label>
          <select
            className="p-2 border border-[#e5ede9] rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            value={fieldType}
            onChange={e => setFieldType(e.target.value as (typeof FIELD_TYPES)[number])}
          >
            {FIELD_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-ink-muted pb-2.5">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
          Required
        </label>
      </div>

      {fieldType === 'SELECT' && (
        <input
          className="w-full mt-2 p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
          value={optionsText}
          onChange={e => setOptionsText(e.target.value)}
          placeholder="Comma-separated options, e.g. Permanent, Contract, Casual"
        />
      )}

      {formError && <p className="text-[11px] text-red-600 mt-2">{formError}</p>}

      <button
        onClick={handleAdd}
        disabled={create.isPending}
        className="mt-3 px-5 py-2 rounded-lg border-none bg-violet-600 text-white text-sm font-semibold cursor-pointer hover:bg-violet-700 transition-colors disabled:opacity-60"
      >
        {create.isPending ? 'Adding…' : 'Add field'}
      </button>
    </div>
  )
}

export function Settings() {
  const { data, isLoading, error, isPending, save } = useSaccoSettings()

  // Mirrors the fields SaccoSettingsSerializer actually exposes.
  const [formData, setFormData] = useState({
    min_loan_amount: '',
    max_loan_amount: '',
    loan_multiplier: '',
    guarantor_type_allowed: 'BOTH',
    registration_fee: '',
    monthly_contribution_amount: '',
    sms_daily_limit: '',
  })

  const settings = data?.settings
  useEffect(() => {
    if (!settings) return
    setFormData({
      min_loan_amount: String(settings.min_loan_amount ?? 1000),
      max_loan_amount: String(settings.max_loan_amount ?? 500000),
      loan_multiplier: String(settings.loan_multiplier ?? 3),
      guarantor_type_allowed: settings.guarantor_type_allowed ?? 'BOTH',
      registration_fee: String(settings.registration_fee ?? 0),
      monthly_contribution_amount: String(settings.monthly_contribution_amount ?? 0),
      sms_daily_limit: String(settings.sms_daily_limit ?? 1000),
    })
  }, [settings])

  const handleSave = () => {
    save({
      guarantor_type_allowed: formData.guarantor_type_allowed,
      min_loan_amount: Number(formData.min_loan_amount),
      max_loan_amount: Number(formData.max_loan_amount),
      loan_multiplier: Number(formData.loan_multiplier),
      registration_fee: Number(formData.registration_fee),
      monthly_contribution_amount: Number(formData.monthly_contribution_amount),
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
            <p className="text-[10px] text-ink-faint mt-1">
              Whether a specific loan product requires guarantors is set per loan type.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Limits */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mt-5">
        <div className="font-semibold text-sm text-ink mb-1 border-b border-surface-3 pb-3">Operational limits</div>
        <p className="text-xs text-ink-muted mb-4">Controls cost guardrails for the SACCO.</p>

        <div className="grid grid-cols-2 gap-6">
          {field(
            'SMS daily send limit',
            'sms_daily_limit',
            'number',
            'Maximum number of SMS messages that can be sent in a single day. Prevents runaway costs.',
          )}
        </div>
      </div>

      <SavingsTypesCard />

      <ThemeSettingsCard />

      <MemberFieldsCard />

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
