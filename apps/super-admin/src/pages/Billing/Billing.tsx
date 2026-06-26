import { useState } from 'react'
import { useInvoices, useInvoice, useResendInvoice, useDownloadInvoice } from '../../hooks/useBilling'

export function Billing() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const { data: invoices, isLoading } = useInvoices()
  const { data: selectedInvoice } = useInvoice(selectedInvoiceId || '')
  const resendInvoice = useResendInvoice()
  const downloadInvoice = useDownloadInvoice()

  const handleResend = async (id: string) => {
    try {
      await resendInvoice.mutateAsync(id)
      alert('Invoice resent successfully')
    } catch (error) {
      console.error('Failed to resend invoice:', error)
      alert('Failed to resend invoice')
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
          <div className="text-xs text-ink-muted">Monthly platform invoices (admin/super admin)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Invoices list */}
        <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
          <div className="p-3 border-b border-surface-2 font-semibold text-sm text-ink">Invoices</div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {['Invoice', 'SACCO', 'Amount', 'Status', 'Actions'].map(h => (
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
                    <td className="py-2.5 px-3 text-ink-muted text-xs">{invoice.sacco?.name || '—'}</td>
                    <td className="py-2.5 px-3 font-medium">KES {invoice.amount?.toLocaleString() || '0'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        invoice.status === 'paid' ? 'bg-mint-50 text-mint-700' :
                        invoice.status === 'pending' ? 'bg-amber-50 text-amber-700' :
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
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResend(invoice.id) }}
                          className="px-2 py-1 rounded text-xs bg-mint-50 text-mint-700 hover:bg-mint-100"
                        >
                          Resend
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
                <div className="text-xs text-ink-muted mb-1">SACCO</div>
                <div className="text-sm">{selectedInvoice.sacco?.name || '—'}</div>
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
                <div className="text-xs text-ink-muted mb-1">Created</div>
                <div className="text-sm">{selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Select an invoice to view details.</div>
          )}
        </div>
      </div>
    </div>
  )
}
