import { useState } from 'react'
import { useSMSCampaigns, useCreateSMSCampaign, useSendSMSCampaign } from '../../hooks/useBulkSMS'
import type { BulkSMSCampaign } from '@saccosphere/schemas'

const statusStyles: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: 'bg-amber-50', color: 'text-amber-700' },
  QUEUED: { bg: 'bg-blue-50', color: 'text-blue-700' },
  SENDING: { bg: 'bg-blue-50', color: 'text-blue-700' },
  COMPLETED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  PARTIAL: { bg: 'bg-amber-50', color: 'text-amber-700' },
  FAILED: { bg: 'bg-red-50', color: 'text-red-700' },
}

const AUDIENCE_OPTIONS: { value: string; label: string; filter: Record<string, string> }[] = [
  { value: 'all', label: 'All approved members', filter: { status: 'APPROVED' } },
  { value: 'bosa', label: 'BOSA savers', filter: { savings_type: 'BOSA' } },
  { value: 'fosa', label: 'FOSA savers', filter: { savings_type: 'FOSA' } },
  { value: 'share', label: 'Share-capital holders', filter: { savings_type: 'SHARE_CAPITAL' } },
]

export function BulkSMS() {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')

  const { data: campaigns, isLoading } = useSMSCampaigns()
  const { mutate: createCampaign, isPending: isCreating } = useCreateSMSCampaign()
  const { mutate: sendCampaign } = useSendSMSCampaign()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === audience) ?? AUDIENCE_OPTIONS[0]
    createCampaign(
      { message, audience_filter: opt.filter },
      {
        onSuccess: () => {
          setShowModal(false)
          setMessage('')
          alert('Bulk SMS campaign created as a draft.')
        },
        onError: (err: any) => alert(err?.message || 'Failed to create campaign.'),
      }
    )
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-lg font-semibold text-ink">Bulk SMS & Member Messaging</div>
          <div className="text-xs text-ink-muted">Send broadcasts and updates to member phones.</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 rounded-lg border border-mint-600 bg-mint-600 text-white text-sm cursor-pointer hover:bg-mint-700 transition-colors font-medium"
        >
          + New SMS Campaign
        </button>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-[11px] text-blue-800">
        Only members who have opted into marketing messages receive bulk SMS. Recipient counts reflect that consent.
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-[#e5ede9]">
              {['Audience', 'Message', 'Recipients', 'Sent / Failed', 'Status', 'Created', 'Action'].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2].map((i) => (
                <tr key={i}><td colSpan={7} className="p-5"><div className="h-5 bg-ink-faint rounded-[4px]" /></td></tr>
              ))
            ) : (campaigns ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ink-muted italic">
                  No SMS campaigns yet. Click "+ New SMS Campaign" to create one.
                </td>
              </tr>
            ) : (
              (campaigns ?? []).map((c: BulkSMSCampaign, ri: number) => {
                const style = statusStyles[c.status] ?? statusStyles.DRAFT
                return (
                  <tr key={c.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                    <td className="px-3 py-3 text-xs text-ink-muted">{c.audience_label}</td>
                    <td className="px-3 py-3 text-xs text-ink max-w-[320px] truncate" title={c.message}>{c.message}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{c.total_recipients.toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{c.sent_count} / {c.failed_count}</td>
                    <td className="px-3 py-3">
                      <span className={`${style.bg} ${style.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      {c.status === 'DRAFT' ? (
                        <button
                          onClick={() => {
                            if (confirm(`Send this SMS to ${c.total_recipients} member(s)?`)) sendCampaign(c.id)
                          }}
                          className="px-2.5 py-1 rounded bg-mint-600 text-white text-[11px] font-medium hover:bg-mint-700"
                        >
                          Send
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-[#e5ede9] shadow-xl">
            <div className="text-base font-semibold text-ink mb-1">Create Bulk SMS Campaign</div>
            <div className="text-xs text-ink-muted mb-4">Creates a draft; review the recipient count, then send.</div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mint-600"
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Message</label>
                <textarea
                  rows={4}
                  placeholder="Type your SMS message here…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                  required
                />
                <p className="text-[10px] text-ink-muted mt-1">
                  {message.length} chars (~{Math.ceil(message.length / 160) || 1} SMS unit)
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5ede9]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-ink-faint bg-white text-sm hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-3.5 py-1.5 rounded-lg bg-mint-600 text-white text-sm font-medium hover:bg-mint-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating…' : 'Save draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
