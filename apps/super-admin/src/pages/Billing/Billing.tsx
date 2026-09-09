import { useState } from 'react'
import { useInvoices, useInvoice, useDownloadInvoice, useMarkInvoicePaid } from '../../hooks/useBilling'
import { useAllSaccos } from '../../hooks/usePlatformData'

const STATUS_OPTIONS = ['', 'draft', 'sent', 'paid', 'overdue', 'suspended']
const PAYMENT_METHODS: Array<'mpesa' | 'bank' | 'internal'> = ['mpesa', 'bank', 'internal']

export function Billing() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [saccoFilter, setSaccoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'internal'>('mpesa')
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  const { data: invoices, isLoading } = useInvoices({
    sacco_id: saccoFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: selectedInvoice } = useInvoice(selectedInvoiceId || '')
  const { data: saccos } = useAllSaccos()
  const downloadInvoice = useDownloadInvoice()
  const markPaid = useMarkInvoicePaid()

  const handleMarkPaid = async () => {
    if (!selectedInvoice || !paymentRef.trim()) {
      setNotice({ ok: false, text: 'A payment reference is required.' })
      return
    }
    try {
      const res = await markPaid.mutateAsync({
        id: selectedInvoice.id,
        amount: Number(selectedInvoice.amount) || 0,
        payment_ref: paymentRef.trim(),
        payment_method: paymentMethod,
      })
      setNotice({ ok: true, text: res.detail || 'Invoice marked paid. SACCO access restored.' })
      setPaymentRef('')
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Failed to mark invoice paid.' })
    }
  }

  const handleDownload = async (id: string, format: 'csv' | 'pdf' = 'pdf') => {
    try {
      const result = await downloadInvoice.mutateAsync({ id, format })
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download invoice:', error)
      alert('Failed to download invoice')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Billing & Invoices</div>
          <div className="text-xs text-ink-muted">Monthly platform invoices across all SACCOs</div>
        </div>
      </div>

      <div className="flex gap-2.5 mb-4">
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={saccoFilter}
          onChange={(e) => { setSaccoFilter(e.target.value); setSelectedInvoiceId(null) }}
        >
          <option value="">All SACCOs</option>
          {(saccos?.results ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}</option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-ink-faint mb-3">
        Invoice records don't carry a SACCO name — filter by SACCO above to see a single SACCO's invoices.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Invoices list */}
        <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
          <div className="p-3 border-b border-surface-2 font-semibold text-sm text-ink">
            Invoices{invoices ? ` (${invoices.length})` : ''}
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {['Invoice', 'Period', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-muted">Loading invoices...</td>
                </tr>
              ) : !invoices || invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-muted">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice: any) => (
                  <tr
                    key={invoice.id}
                    className={`border-b border-surface-2 cursor-pointer hover:bg-violet-50/50 ${selectedInvoiceId === invoice.id ? 'bg-violet-50' : ''}`}
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <td className="py-2.5 px-3 font-medium text-xs">{invoice.invoice_number || invoice.id}</td>
                    <td className="py-2.5 px-3 text-ink-muted text-xs">{invoice.period || '—'}</td>
                    <td className="py-2.5 px-3 font-medium">KES {invoice.amount?.toLocaleString() || '0'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        invoice.status === 'paid' ? 'bg-mint-50 text-mint-700' :
                        invoice.status === 'sent' || invoice.status === 'draft' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(invoice.id, 'pdf') }}
                          className="px-2 py-1 rounded text-xs bg-violet-50 text-violet-700 hover:bg-violet-100"
                        >
                          PDF
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(invoice.id, 'csv') }}
                          className="px-2 py-1 rounded text-xs bg-violet-50 text-violet-700 hover:bg-violet-100"
                        >
                          CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice detail */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-4">Invoice Details</div>
          {selectedInvoice ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-muted mb-1">Invoice Number</div>
                <div className="text-sm font-medium">{selectedInvoice.invoice_number || selectedInvoice.id}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Amount</div>
                <div className="text-sm font-medium">KES {selectedInvoice.amount?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Status</div>
                <div className="text-sm capitalize">{selectedInvoice.status}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Period</div>
                <div className="text-sm">{selectedInvoice.period || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Due Date</div>
                <div className="text-sm">{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Sent</div>
                <div className="text-sm">{selectedInvoice.sent_at ? new Date(selectedInvoice.sent_at).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted mb-1">Line items</div>
                <div className="text-sm">{selectedInvoice.line_items_count ?? (selectedInvoice.line_items?.length ?? 0)}</div>
              </div>

              {selectedInvoice.status !== 'paid' && (
                <div className="mt-4 pt-4 border-t border-surface-2 space-y-2">
                  <div className="text-xs font-semibold text-ink">Record payment</div>
                  <p className="text-[11px] text-ink-faint">
                    Marks the invoice paid and immediately clears the SACCO's billing suspension.
                    Amount is taken from the invoice total ({`KES ${selectedInvoice.amount?.toLocaleString() || '0'}`}).
                  </p>
                  <input
                    className="w-full py-1.5 px-2 border border-mid rounded-lg text-[13px] outline-none"
                    placeholder="Payment reference (M-Pesa code, bank ref…)"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                  <select
                    className="w-full py-1.5 px-2 border border-mid rounded-lg text-[13px] outline-none bg-surface"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'mpesa' | 'bank' | 'internal')}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleMarkPaid}
                    disabled={markPaid.isPending || !paymentRef.trim()}
                    className="w-full py-2 rounded-lg bg-mint-600 hover:bg-mint-700 text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    {markPaid.isPending ? 'Recording…' : 'Mark as paid'}
                  </button>
                </div>
              )}

              {notice && (
                <div
                  className={`text-[12px] rounded-lg px-3 py-2 ${
                    notice.ok ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {notice.text}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Select an invoice to view details.</div>
          )}
        </div>
      </div>
    </div>
  )
}
