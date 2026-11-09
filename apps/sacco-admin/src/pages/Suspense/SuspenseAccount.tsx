import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { StepUpModal } from '../../components/auth/StepUpModal'

const STATUS_STYLES: Record<string, string> = {
  UNMATCHED: 'bg-amber-50 text-amber-700 border-amber-200',
  CLEARED: 'bg-mint-50 text-mint-700 border-mint-200',
  REFUNDED: 'bg-blue-50 text-blue-700 border-blue-200',
}

type PickedMember = { id: string; label: string }

function MemberPicker({ selected, setSelected }: { selected: PickedMember | null; setSelected: (v: PickedMember | null) => void }) {
  const [search, setSearch] = useState('')
  const { data: results } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or member number"
        value={selected ? '' : search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
        className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
        disabled={!!selected}
      />
      {selected ? (
        <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1 text-xs">
          <span className="text-ink font-medium">{selected.label}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-violet-700 font-semibold">Change</button>
        </div>
      ) : search && (results?.results ?? []).length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {(results?.results ?? []).map((m: any) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setSelected({ id: m.id, label: `${m.first_name} ${m.last_name} · ${m.member_number}` })}
              className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded text-xs"
            >
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function SuspenseAccount() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'UNMATCHED' | 'CLEARED' | 'REFUNDED' | ''>('UNMATCHED')
  const [minAgeDays, setMinAgeDays] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [mode, setMode] = useState<'clear' | 'refund' | null>(null)
  const [clearMember, setClearMember] = useState<PickedMember | null>(null)
  const [aliasId, setAliasId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [showStepUp, setShowStepUp] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['suspense-items', statusFilter, minAgeDays],
    queryFn: () => api.suspense.getItems({ status: statusFilter || undefined, min_age_days: minAgeDays ? Number(minAgeDays) : undefined }),
  })

  const resetAction = () => {
    setSelectedItem(null)
    setMode(null)
    setClearMember(null)
    setAliasId('')
    setPhoneNumber('')
    setShowStepUp(false)
    setStepUpError(null)
  }

  const clearMutation = useMutation({
    mutationFn: (code?: string) =>
      api.suspense.clearItem(selectedItem.id, { membership_id: clearMember!.id, payment_alias_id: aliasId || undefined, verification_code: code }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['suspense-items'] })
      resetAction()
      setMsg(result?.id ? 'Submitted for a second admin to approve.' : 'Cleared to member.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => {
      if (err?.status === 428) {
        setShowStepUp(true)
        setStepUpError(err?.message || null)
        return
      }
      setMsg(err?.message || 'Failed to clear this item.')
    },
  })

  const refundMutation = useMutation({
    mutationFn: (code?: string) => api.suspense.refundItem(selectedItem.id, { phone_number: phoneNumber, verification_code: code }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['suspense-items'] })
      resetAction()
      setMsg(result?.id ? 'Submitted for a second admin to approve.' : 'Refund requested.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => {
      if (err?.status === 428) {
        setShowStepUp(true)
        setStepUpError(err?.message || null)
        return
      }
      setMsg(err?.message || 'Failed to refund this item.')
    },
  })

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Suspense Account"
        subtitle="M-Pesa payments that arrived but couldn't be matched to a member automatically"
        info="A paybill payment lands here when its account reference doesn't match any member's known payment target. Clear it to the right member once you've identified them, or refund it back to the payer if it can't be matched at all — both need a second admin's approval."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">{msg}</div>}

      <Card title="Filters">
        <div className="flex gap-3 text-xs items-end">
          <div>
            <label className="text-ink-muted mb-1 block">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="p-2 border border-ink-faint rounded bg-white">
              <option value="">All</option>
              <option value="UNMATCHED">Unmatched</option>
              <option value="CLEARED">Cleared</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="text-ink-muted mb-1 block">Minimum Age (days)</label>
            <input type="number" value={minAgeDays} onChange={(e) => setMinAgeDays(e.target.value)} className="p-2 border border-ink-faint rounded bg-white w-28" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Suspense Items" className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                  <th className="py-2 px-3">Bill Reference</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3">Age</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-6 text-center text-ink-muted">Loading suspense items...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-ink-muted">Nothing in suspense right now.</td></tr>
                ) : (
                  items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-mono text-ink">{item.bill_ref_number || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">KES {Number(item.amount ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-ink-muted">{item.age_days}d</td>
                      <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded text-[10px] border ${STATUS_STYLES[item.status] ?? ''}`}>{item.status}</span></td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        {item.status === 'UNMATCHED' && (
                          <>
                            <button onClick={() => { setSelectedItem(item); setMode('clear') }} className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold">Clear to Member</button>
                            <button onClick={() => { setSelectedItem(item); setMode('refund') }} className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10px] font-bold">Refund</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Resolve" className="md:col-span-1">
          {!selectedItem || !mode ? (
            <div className="text-xs text-ink-muted p-2">Select an unmatched item to clear it to a member or refund it.</div>
          ) : mode === 'clear' ? (
            <div className="space-y-3 text-xs">
              <div className="font-bold text-ink">Clear KES {Number(selectedItem.amount).toLocaleString()} to Member</div>
              <MemberPicker selected={clearMember} setSelected={setClearMember} />
              <div>
                <label className="text-ink-muted mb-1 block flex items-center gap-1.5">
                  Specific Payment Target (Optional)
                  <InfoTip text="Leave this blank to run the member's normal allocation waterfall. Only set it if you need this payment to go to one specific savings/loan account." label="When to set this" />
                </label>
                <input type="text" placeholder="Payment target UUID (optional)" value={aliasId} onChange={(e) => setAliasId(e.target.value)} className="w-full p-2 border border-ink-faint rounded font-mono bg-white" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => clearMember && clearMutation.mutate(undefined)}
                  disabled={!clearMember || clearMutation.isPending}
                  className="flex-1 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer disabled:opacity-50"
                >
                  Clear
                </button>
                <button onClick={resetAction} className="px-3 py-2 border border-ink-faint rounded text-ink-muted">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="font-bold text-ink">Refund KES {Number(selectedItem.amount).toLocaleString()} via B2C</div>
              <div>
                <label className="text-ink-muted mb-1 block">Phone Number</label>
                <input type="text" placeholder="254712345678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => phoneNumber && refundMutation.mutate(undefined)}
                  disabled={!phoneNumber || refundMutation.isPending}
                  className="flex-1 py-2 bg-amber-600 text-white font-bold rounded cursor-pointer disabled:opacity-50"
                >
                  Refund
                </button>
                <button onClick={resetAction} className="px-3 py-2 border border-ink-faint rounded text-ink-muted">Cancel</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <StepUpModal
        isOpen={showStepUp}
        title={mode === 'refund' ? 'Authorize Suspense Refund' : 'Authorize Suspense Clearing'}
        description="This moves money and requires second-factor staff authorization."
        error={stepUpError}
        onClose={() => { setShowStepUp(false); setStepUpError(null) }}
        onSubmitCode={(code) => (mode === 'refund' ? refundMutation.mutate(code) : clearMutation.mutate(code))}
      />
    </div>
  )
}
