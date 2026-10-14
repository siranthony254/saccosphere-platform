import { useState } from 'react'
import {
  useCollectionsQueue,
  usePAR,
  useLoanContacts,
  useLogLoanContact,
  useLoanPromises,
  useCreateLoanPromise,
  useCancelLoanPromise,
  useInitiateGuarantorRecovery,
} from '../../hooks/useCollections'

const CHANNELS: { value: 'CALL' | 'SMS' | 'VISIT' | 'OTHER'; label: string }[] = [
  { value: 'CALL', label: 'Phone call' },
  { value: 'SMS', label: 'SMS' },
  { value: 'VISIT', label: 'Field visit' },
  { value: 'OTHER', label: 'Other' },
]

const OUTCOMES = ['REACHED', 'NO_ANSWER', 'PROMISED', 'REFUSED', 'WRONG_NUMBER', 'OTHER']

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `KES ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'

function LoanDetailModal({ loanId, borrowerName, onClose }: { loanId: string; borrowerName: string; onClose: () => void }) {
  const { data: contacts = [], isLoading: contactsLoading } = useLoanContacts(loanId)
  const { data: promises = [], isLoading: promisesLoading } = useLoanPromises(loanId)
  const logContact = useLogLoanContact(loanId)
  const createPromise = useCreateLoanPromise(loanId)
  const cancelPromise = useCancelLoanPromise(loanId)
  const initiateRecovery = useInitiateGuarantorRecovery(loanId)

  const [channel, setChannel] = useState<'CALL' | 'SMS' | 'VISIT' | 'OTHER'>('CALL')
  const [outcome, setOutcome] = useState(OUTCOMES[0])
  const [notes, setNotes] = useState('')
  const [contactError, setContactError] = useState<string | null>(null)

  const [promisedOn, setPromisedOn] = useState('')
  const [amount, setAmount] = useState('')
  const [promiseError, setPromiseError] = useState<string | null>(null)

  const [recoveryAmount, setRecoveryAmount] = useState('')
  const [recoveryStatus, setRecoveryStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const openPromise = promises.find((p: any) => p.status === 'OPEN')

  const handleLogContact = () => {
    setContactError(null)
    logContact.mutate(
      { channel, outcome, notes: notes.trim() || undefined },
      {
        onSuccess: () => setNotes(''),
        onError: (err: any) => setContactError(err?.message || 'Failed to log this contact.'),
      }
    )
  }

  const handleCreatePromise = () => {
    setPromiseError(null)
    if (!promisedOn || !amount) {
      setPromiseError('Both a promised date and amount are required.')
      return
    }
    createPromise.mutate(
      { promised_on: promisedOn, amount: Number(amount) },
      {
        onSuccess: () => {
          setPromisedOn('')
          setAmount('')
        },
        onError: (err: any) => setPromiseError(err?.message || 'Failed to create promise to pay.'),
      }
    )
  }

  const handleInitiateRecovery = () => {
    setRecoveryStatus(null)
    if (!recoveryAmount) {
      setRecoveryStatus({ type: 'error', message: 'Enter the amount to recover from guarantors.' })
      return
    }
    initiateRecovery.mutate(Number(recoveryAmount), {
      onSuccess: () => {
        setRecoveryStatus({ type: 'success', message: 'Submitted to the maker-checker queue for approval.' })
        setRecoveryAmount('')
      },
      onError: (err: any) => setRecoveryStatus({ type: 'error', message: err?.message || 'Failed to initiate guarantor recovery.' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-5 border border-[#e5ede9] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
          <div>
            <div className="font-bold text-lg text-ink">{borrowerName}</div>
            <div className="text-[11px] text-ink-faint font-mono">{loanId}</div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl font-bold cursor-pointer">&times;</button>
        </div>

        {/* Contact history + log form */}
        <div>
          <div className="text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Contact history</div>
          {contactsLoading ? (
            <div className="text-xs text-ink-muted py-2">Loading contacts…</div>
          ) : contacts.length === 0 ? (
            <div className="text-xs text-ink-muted py-2">No contact attempts logged yet.</div>
          ) : (
            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
              {contacts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-ink">{c.channel}</span>
                    <span className="ml-2 text-ink-muted">{c.outcome}</span>
                    {c.notes && <div className="text-[10px] text-ink-faint mt-0.5">{c.notes}</div>}
                  </div>
                  <span className="text-[10px] text-ink-faint whitespace-nowrap">{new Date(c.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-3 bg-surface-2 rounded-lg">
            <select value={channel} onChange={e => setChannel(e.target.value as any)} className="p-2 border border-[#e5ede9] rounded-lg text-xs bg-white">
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={outcome} onChange={e => setOutcome(e.target.value)} className="p-2 border border-[#e5ede9] rounded-lg text-xs bg-white">
              {OUTCOMES.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="col-span-2 p-2 border border-[#e5ede9] rounded-lg text-xs"
            />
            {contactError && <p className="col-span-2 text-[11px] text-red-600">{contactError}</p>}
            <button
              onClick={handleLogContact}
              disabled={logContact.isPending}
              className="col-span-2 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {logContact.isPending ? 'Logging…' : 'Log contact attempt'}
            </button>
          </div>
        </div>

        {/* Promises to pay */}
        <div>
          <div className="text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Promises to pay</div>
          {promisesLoading ? (
            <div className="text-xs text-ink-muted py-2">Loading promises…</div>
          ) : promises.length === 0 ? (
            <div className="text-xs text-ink-muted py-2">No promises recorded.</div>
          ) : (
            <div className="space-y-1.5 mb-3">
              {promises.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-ink">{formatCurrency(p.amount)}</span>
                    <span className="ml-2 text-ink-muted">by {new Date(p.promised_on).toLocaleDateString()}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'OPEN' ? 'bg-amber-50 text-amber-700' : p.status === 'KEPT' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'
                    }`}>{p.status}</span>
                  </div>
                  {p.status === 'OPEN' && (
                    <button
                      onClick={() => cancelPromise.mutate(p.id)}
                      disabled={cancelPromise.isPending}
                      className="text-[11px] text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!openPromise && (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 p-3 bg-surface-2 rounded-lg items-end">
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">Promised date</label>
                <input type="date" value={promisedOn} onChange={e => setPromisedOn(e.target.value)} className="w-full p-2 border border-[#e5ede9] rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">Amount (KES)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border border-[#e5ede9] rounded-lg text-xs" />
              </div>
              <button
                onClick={handleCreatePromise}
                disabled={createPromise.isPending}
                className="py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 h-fit"
              >
                {createPromise.isPending ? 'Saving…' : 'Add'}
              </button>
              {promiseError && <p className="col-span-3 text-[11px] text-red-600">{promiseError}</p>}
            </div>
          )}
          {openPromise && (
            <p className="text-[11px] text-ink-faint">
              There's already an open promise for this loan — it resolves automatically overnight based on whether payment came in.
            </p>
          )}
        </div>

        {/* Guarantor recovery */}
        <div className="border-t border-[#e5ede9] pt-4">
          <div className="text-xs font-semibold text-ink mb-1 uppercase tracking-wide">Guarantor recovery</div>
          <p className="text-[11px] text-ink-faint mb-2">
            Draws down a guarantor's pledged savings against this loan's arrears. Always goes through the
            maker-checker approval queue — nothing moves until a second admin approves it there.
          </p>
          {recoveryStatus && (
            <div className={`p-2.5 rounded-lg text-[11px] font-semibold mb-2 ${recoveryStatus.type === 'success' ? 'bg-mint-50 text-mint-700 border border-mint-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {recoveryStatus.message}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              value={recoveryAmount}
              onChange={e => setRecoveryAmount(e.target.value)}
              placeholder="Amount to recover (KES)"
              className="flex-1 p-2 border border-[#e5ede9] rounded-lg text-xs"
            />
            <button
              onClick={handleInitiateRecovery}
              disabled={initiateRecovery.isPending}
              className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {initiateRecovery.isPending ? 'Submitting…' : 'Initiate recovery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Collections() {
  const [tab, setTab] = useState<'queue' | 'par'>('queue')
  const [minDays, setMinDays] = useState(1)
  const { data: queue = [], isLoading: queueLoading } = useCollectionsQueue(minDays)
  const { data: par, isLoading: parLoading } = usePAR()
  const [selected, setSelected] = useState<{ loan_id: string; borrower_name: string } | null>(null)

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-xl font-bold text-ink">Collections</div>
        <div className="text-xs text-ink-muted">Overdue-loan worklist, contact logging, promises to pay, and portfolio-at-risk.</div>
      </div>

      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setTab('queue')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${tab === 'queue' ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
        >
          Queue
        </button>
        <button
          onClick={() => setTab('par')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${tab === 'par' ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
        >
          Portfolio at risk
        </button>
      </div>

      {tab === 'queue' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>Show loans overdue by at least</span>
            <input
              type="number"
              min={0}
              value={minDays}
              onChange={e => setMinDays(Number(e.target.value) || 0)}
              className="w-16 p-1.5 border border-[#e5ede9] rounded-lg text-xs"
            />
            <span>day(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Days overdue</th>
                  <th className="py-2.5 px-3">Arrears</th>
                  <th className="py-2.5 px-3">Outstanding</th>
                  <th className="py-2.5 px-3">Last contact</th>
                  <th className="py-2.5 px-3">Open promise</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {queueLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-ink-muted text-sm">Loading collections queue…</td></tr>
                ) : queue.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-ink-muted text-sm">No overdue loans at this threshold.</td></tr>
                ) : (
                  queue.map((row: any) => (
                    <tr key={row.loan_id} className="hover:bg-surface-1 transition-colors">
                      <td className="py-2.5 px-3 text-xs font-semibold text-ink">
                        {row.borrower_name}
                        <div className="text-[10px] text-ink-faint">{row.member_number}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-bold text-red-700">{row.days_past_due}</td>
                      <td className="py-2.5 px-3 text-xs text-ink">{formatCurrency(row.arrears_amount)}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">{formatCurrency(row.outstanding_balance)}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">
                        {row.last_contact ? `${row.last_contact.channel} · ${row.last_contact.outcome}` : 'None'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">
                        {row.open_promise ? `${formatCurrency(row.open_promise.amount)} by ${new Date(row.open_promise.promised_on).toLocaleDateString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelected({ loan_id: row.loan_id, borrower_name: row.borrower_name })}
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Work this loan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'par' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          {parLoading ? (
            <div className="text-sm text-ink-muted py-4">Loading PAR report…</div>
          ) : !par ? (
            <div className="text-sm text-red-600 py-4">Failed to load PAR report.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-2 rounded-xl">
                  <div className="text-[11px] text-ink-muted">Total outstanding</div>
                  <div className="text-lg font-bold text-ink">{formatCurrency(par.total_outstanding)}</div>
                </div>
                <div className="p-4 bg-surface-2 rounded-xl">
                  <div className="text-[11px] text-ink-muted">Shielded by guarantors</div>
                  <div className="text-lg font-bold text-ink">{formatCurrency(par.shielded_exposure)}</div>
                </div>
              </div>
              <div className="text-[10px] text-ink-faint">As of {par.as_of ? new Date(par.as_of).toLocaleString() : '—'}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                      <th className="py-2.5 px-3">Band (days overdue)</th>
                      <th className="py-2.5 px-3">At-risk amount</th>
                      <th className="py-2.5 px-3">At-risk loans</th>
                      <th className="py-2.5 px-3">Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ede9]">
                    {par.bands.map((b: any) => (
                      <tr key={b.band_days}>
                        <td className="py-2.5 px-3 text-xs font-semibold text-ink">{b.band_days}+</td>
                        <td className="py-2.5 px-3 text-xs text-ink">{formatCurrency(b.at_risk_amount)}</td>
                        <td className="py-2.5 px-3 text-xs text-ink-muted">{b.at_risk_loans}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-amber-700">{(b.ratio * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {selected && (
        <LoanDetailModal loanId={selected.loan_id} borrowerName={selected.borrower_name} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
