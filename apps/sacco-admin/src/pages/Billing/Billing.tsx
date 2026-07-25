import { useInvoices, useResendInvoice, useDownloadInvoice } from '../../hooks/useBilling'
import type { MonthlyInvoice } from '@saccosphere/schemas'

const statusStyles: Record<string, { bg: string; color: string }> = {
  paid: { bg: 'bg-mint-50', color: 'text-mint-700' },
  pending: { bg: 'bg-amber-50', color: 'text-amber-700' },
  overdue: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function Billing() {
  const { data: invoiceData, isLoading } = useInvoices()
  const { mutate: resendInvoice } = useResendInvoice()
  const { mutate: downloadInvoice } = useDownloadInvoice()

  const handleDownload = (id: string, format: 'pdf' | 'csv') => {
    downloadInvoice(
      { id, format },
      {
        onSuccess: ({ blob, filename }) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        },
        onError: (err: any) => alert(err?.message || 'Failed to download invoice document.'),
      }
    )
  }

  const handleResend = (id: string) => {
    resendInvoice(id, {
      onSuccess: () => alert('Invoice email resent successfully.'),
      onError: (err: any) => alert(err?.message || 'Failed to resend invoice.'),
    })
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">SaaS Billing & Invoices</div>
          <div className="text-xs text-ink-muted">Monthly platform subscription invoices and payment status</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-[#e5ede9]">
              {['Invoice No.', 'Billing Period', 'Amount (KES)', 'Status', 'Due Date', 'Paid Date', 'Actions'].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-5">
                    <div className="h-5 bg-ink-faint rounded-[4px]" />
                  </td>
                </tr>
              ))
            ) : (invoiceData?.results ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ink-muted italic">
                  No billing invoices issued yet.
                </td>
              </tr>
            ) : (
              (invoiceData?.results ?? []).map((inv: MonthlyInvoice, ri: number) => {
                const style = statusStyles[inv.status] ?? statusStyles.pending
                return (
                  <tr key={inv.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                    <td className="px-3 py-3 font-mono font-semibold text-ink">{inv.invoice_number}</td>
                    <td className="px-3 py-3 text-xs text-ink">{inv.period}</td>
                    <td className="px-3 py-3 font-semibold text-ink">KES {inv.amount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className={`${style.bg} ${style.color} px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{inv.due_date}</td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{inv.paid_date ?? '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(inv.id, 'pdf')}
                          className="px-2.5 py-1 rounded border border-ink-faint bg-white text-ink text-[11px] font-medium hover:bg-surface-2"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleResend(inv.id)}
                          className="px-2.5 py-1 rounded bg-violet-50 text-violet-700 text-[11px] font-medium hover:bg-violet-100"
                        >
                          Email Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
