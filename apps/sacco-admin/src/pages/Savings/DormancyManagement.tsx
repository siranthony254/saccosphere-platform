import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'

const OUTREACH_CHANNELS = [
  { value: 'SMS', label: 'SMS' },
  { value: 'CALL', label: 'Phone call' },
  { value: 'OTHER', label: 'Other' },
]

const OUTREACH_OUTCOMES = [
  { value: 'REACHED', label: 'Reached the member' },
  { value: 'NO_ANSWER', label: 'No answer' },
  { value: 'WRONG_NUMBER', label: 'Wrong number' },
  { value: 'OTHER', label: 'Other' },
]

export function DormancyManagement() {
  const [activeTab, setActiveTab] = useState<'dormant' | 'ufaa'>('dormant')

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Dormant Accounts &amp; UFAA"
        subtitle="Savings that have gone quiet, outreach to reactivate them, and surrendering unclaimed funds to UFAA when required"
        info="An account goes dormant after a long stretch with no member-initiated activity. Log every attempt to reach the member here — once a deposit has been dormant long enough and a UFAA annual return is filed, it can be surrendered to the Unclaimed Financial Assets Authority."
      />

      <div className="flex gap-2 border-b border-[#e5ede9]">
        {(['dormant', 'ufaa'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer ${
              activeTab === tab ? 'border-b-2 border-violet-600 text-violet-700' : 'text-ink-muted'
            }`}
          >
            {tab === 'dormant' ? 'Dormant Accounts' : 'UFAA Surrender'}
          </button>
        ))}
      </div>

      {activeTab === 'dormant' ? <DormantAccountsTab /> : <UfaaSurrenderTab />}
    </div>
  )
}

function DormantAccountsTab() {
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(null)
  const [channel, setChannel] = useState('SMS')
  const [outcome, setOutcome] = useState('REACHED')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const { data: dormantSavings = [], isLoading } = useQuery({
    queryKey: ['savings-dormant'],
    queryFn: () => api.savings.list({ status: 'dormant' }),
  })

  const selectedSaving = dormantSavings.find((s: any) => s.id === selectedSavingId) ?? null

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['dormancy-detail', selectedSavingId],
    queryFn: async () => {
      const [dormancy, member] = await Promise.all([
        api.dormancy.getDormancyStatus(selectedSavingId as string),
        selectedSaving ? api.saccoAdmin.getMember(selectedSaving.membership_id).catch(() => null) : Promise.resolve(null),
      ])
      return { dormancy, member }
    },
    enabled: !!selectedSavingId,
  })

  const logOutreachMutation = useMutation({
    mutationFn: () => api.dormancy.logOutreach(selectedSavingId as string, { channel, outcome, notes: notes || undefined }),
    onSuccess: () => {
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['dormancy-detail', selectedSavingId] })
    },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card title="Dormant Savings Accounts" className="md:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                <th className="py-2 px-3">SACCO</th>
                <th className="py-2 px-3">Account Type</th>
                <th className="py-2 px-3 text-right">Balance</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {isLoading ? (
                <tr><td colSpan={4} className="py-6 text-center text-ink-muted">Loading dormant accounts...</td></tr>
              ) : dormantSavings.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-ink-muted">No dormant accounts right now.</td></tr>
              ) : (
                dormantSavings.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface-1">
                    <td className="py-2.5 px-3 font-semibold text-ink">{s.sacco_name}</td>
                    <td className="py-2.5 px-3 text-ink-soft">{s.savings_type}</td>
                    <td className="py-2.5 px-3 text-right font-mono">KES {Number(s.amount ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedSavingId(s.id)}
                        className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        View &amp; Log Outreach
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Outreach" className="md:col-span-1">
        {!selectedSavingId ? (
          <div className="text-xs text-ink-muted p-2">Select a dormant account to view its outreach history and log a new attempt.</div>
        ) : isDetailLoading ? (
          <div className="text-xs text-ink-muted p-2">Loading...</div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-2 p-3 rounded border">
              <div className="font-bold text-ink">
                {detail?.member ? `${detail.member.first_name} ${detail.member.last_name}` : 'Member'}
              </div>
              <div className="text-ink-muted">
                Dormant since {detail?.dormancy?.dormant_since ? new Date(detail.dormancy.dormant_since).toLocaleDateString() : '—'}
              </div>
              <div className="text-ink-muted">
                Last activity: {detail?.dormancy?.last_transaction_date ? new Date(detail.dormancy.last_transaction_date).toLocaleDateString() : 'Never'}
              </div>
            </div>

            <div>
              <div className="font-bold text-ink mb-2">Past attempts</div>
              {detail?.dormancy?.outreach_attempts?.length ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {detail.dormancy.outreach_attempts.map((a: any) => (
                    <div key={a.id} className="border-b border-[#e5ede9] pb-1.5">
                      <div className="font-semibold text-ink">{a.channel} — {a.outcome.replace(/_/g, ' ')}</div>
                      <div className="text-ink-faint">{new Date(a.created_at ?? a.attempted_at).toLocaleString()}</div>
                      {!!a.notes && <div className="text-ink-muted">{a.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-ink-muted">No outreach logged yet.</div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="font-bold text-ink flex items-center gap-1.5">
                Log a new attempt
                <InfoTip text="This records that an attempt was made to reach this member — it does not reactivate the account. Reactivation happens separately once the member responds and KYC is refreshed." label="What this does" />
              </div>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white">
                {OUTREACH_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white">
                {OUTREACH_OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <textarea
                rows={2}
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              />
              <button
                onClick={() => logOutreachMutation.mutate()}
                disabled={logOutreachMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50"
              >
                Log Attempt
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function UfaaSurrenderTab() {
  const [returnInstanceId, setReturnInstanceId] = useState('')
  const [resultMsg, setResultMsg] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['ufaa-candidates'],
    queryFn: () => api.ufaa.getSurrenderCandidates(),
  })

  const { data: returnInstances = [] } = useQuery({
    queryKey: ['ufaa-return-instances'],
    queryFn: () => api.returns.getInstances({ template_code: 'UFAA_ANNUAL_RETURN' }),
  })
  const eligibleInstances = returnInstances.filter((r: any) => r.status === 'APPROVED' || r.status === 'FROZEN')

  const totalAmount = candidates.reduce((sum: number, c: any) => sum + Number(c.amount ?? 0), 0)

  const surrenderMutation = useMutation({
    mutationFn: () => api.ufaa.surrender({ return_instance_id: returnInstanceId }),
    onSuccess: (res: any) => {
      setResultMsg(`Surrendered ${res.surrendered_count} deposit(s) totalling KES ${Number(res.surrendered_total ?? 0).toLocaleString()}.`)
      queryClient.invalidateQueries({ queryKey: ['ufaa-candidates'] })
    },
    onError: (err: any) => setResultMsg(err?.message || 'Surrender failed.'),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card title="Surrender-Eligible Deposits" className="md:col-span-2">
        <div className="mb-3 text-xs text-ink-muted flex items-center gap-1.5">
          Deposits that have been dormant long enough to be surrendered to UFAA.
          <InfoTip text="Once surrendered, the SACCO no longer holds this money — the member (or their estate) claims it directly from UFAA, not from the SACCO." label="What happens on surrender" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                <th className="py-2 px-3">Member</th>
                <th className="py-2 px-3">Dormant Since</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {isLoading ? (
                <tr><td colSpan={3} className="py-6 text-center text-ink-muted">Loading...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-ink-muted">No deposits are currently eligible for surrender.</td></tr>
              ) : (
                candidates.map((c: any) => (
                  <tr key={c.saving_id} className="hover:bg-surface-1">
                    <td className="py-2.5 px-3 font-mono text-ink-soft">{c.membership_id}</td>
                    <td className="py-2.5 px-3 text-ink-muted">{c.dormant_since ? new Date(c.dormant_since).toLocaleDateString() : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">KES {Number(c.amount ?? 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            {candidates.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#e5ede9] font-bold">
                  <td className="py-2 px-3" colSpan={2}>Total</td>
                  <td className="py-2 px-3 text-right font-mono">KES {totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      <Card title="Surrender to UFAA" className="md:col-span-1">
        <div className="space-y-3 text-xs">
          <div className="text-ink-muted">
            Requires an APPROVED or FROZEN UFAA Annual Return already filed for this SACCO — file it from Statutory Returns first if none is listed below.
          </div>
          <div>
            <label className="text-ink-muted block mb-1">UFAA Annual Return</label>
            <select
              value={returnInstanceId}
              onChange={(e) => setReturnInstanceId(e.target.value)}
              className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
            >
              <option value="">Select a filed return...</option>
              {eligibleInstances.map((r: any) => (
                <option key={r.id} value={r.id}>{r.period_end ?? r.id} ({r.status})</option>
              ))}
            </select>
            {eligibleInstances.length === 0 && (
              <div className="text-ink-faint mt-1">No APPROVED/FROZEN UFAA return found yet.</div>
            )}
          </div>
          <button
            onClick={() => surrenderMutation.mutate()}
            disabled={!returnInstanceId || candidates.length === 0 || surrenderMutation.isPending}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50"
          >
            Surrender All Eligible Deposits
          </button>
          {!!resultMsg && (
            <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-semibold">{resultMsg}</div>
          )}
        </div>
      </Card>
    </div>
  )
}
