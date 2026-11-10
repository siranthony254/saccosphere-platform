import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'violet'> = {
  PENDING: 'warning',
  SENT: 'violet',
  PAID: 'success',
  FAILED: 'error',
}

export function BillManager() {
  const queryClient = useQueryClient()
  const [msg, setMsg] = useState<string | null>(null)

  // Single-invoice form
  const [aliasId, setAliasId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')

  // Bulk-invoice form
  const [bulkRows, setBulkRows] = useState<Array<{ alias_id: string; amount: string; due_date: string }>>([
    { alias_id: '', amount: '', due_date: '' },
  ])

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['bill-manager-invoices'],
    queryFn: () => api.billManager.getInvoices(),
  })

  const optInMutation = useMutation({
    mutationFn: () => api.billManager.optIn(),
    onSuccess: () => {
      setMsg('Bill Manager is now enabled for this SACCO.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to enable Bill Manager.'),
  })

  const createInvoiceMutation = useMutation({
    mutationFn: () => api.billManager.createInvoice({ alias_id: aliasId, amount: Number(amount), due_date: dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-manager-invoices'] })
      setAliasId('')
      setAmount('')
      setDueDate('')
      setMsg('Invoice created and sent.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to create this invoice — enable Bill Manager first if you haven\'t.'),
  })

  const createBulkMutation = useMutation({
    mutationFn: () =>
      api.billManager.createBulkInvoices(
        bulkRows
          .filter((r) => r.alias_id && r.amount && r.due_date)
          .map((r) => ({ alias_id: r.alias_id, amount: Number(r.amount), due_date: r.due_date }))
      ),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['bill-manager-invoices'] })
      setBulkRows([{ alias_id: '', amount: '', due_date: '' }])
      setMsg(`Bulk invoices created: ${result?.created ?? 0} sent${result?.errors?.length ? `, ${result.errors.length} failed` : ''}.`)
      setTimeout(() => setMsg(null), 6000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to create bulk invoices.'),
  })

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Bill Manager"
        subtitle="Send M-Pesa invoices for a member's loan repayment or savings target, with automatic payment notifications"
        info="Bill Manager is Safaricom's own invoicing product: it texts the member an M-Pesa invoice with a pay button, and tells this SACCO the moment it's paid. Enable it once for the SACCO, then send invoices one at a time or in a batch."
      />

      {msg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">{msg}</div>
      )}

      <Card title="Setup">
        <div className="text-xs space-y-3">
          <div className="text-ink-muted">
            This only needs to be done once per SACCO. Safe to click again if you're not sure whether it's already enabled.
          </div>
          <button
            onClick={() => optInMutation.mutate()}
            disabled={optInMutation.isPending}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
          >
            Enable Bill Manager
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Send a Single Invoice">
          <div className="space-y-3 text-xs">
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded flex items-start gap-1.5">
              <span>
                You'll need the member's payment-target id (a UUID) — there's currently no lookup for this in the admin app; it would need to come from the member themselves or a future admin tool.
              </span>
              <InfoTip text="This invoices one specific payment target — a loan or a savings account — identified by its PaymentAlias id, the same id Standing Orders and the member's own 'How to Pay' screen use internally. There's no admin-facing way to browse these yet." label="Why this needs an id" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Payment Target ID</label>
              <input type="text" placeholder="UUID" value={aliasId} onChange={(e) => setAliasId(e.target.value)} className="w-full p-2 border border-ink-faint rounded font-mono bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-ink-muted mb-1 block">Amount (KES)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
              </div>
            </div>
            <button
              onClick={() => aliasId && amount && dueDate && createInvoiceMutation.mutate()}
              disabled={!aliasId || !amount || !dueDate || createInvoiceMutation.isPending}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
            >
              Send Invoice
            </button>
          </div>
        </Card>

        <Card title="Send Bulk Invoices">
          <div className="space-y-3 text-xs">
            <div className="text-ink-muted">Up to 500 at once. Same payment-target id requirement as a single invoice.</div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {bulkRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Payment target ID"
                    value={row.alias_id}
                    onChange={(e) => setBulkRows((prev) => prev.map((r, idx) => idx === i ? { ...r, alias_id: e.target.value } : r))}
                    className="p-1.5 border border-ink-faint rounded font-mono text-[11px] bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => setBulkRows((prev) => prev.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))}
                    className="p-1.5 border border-ink-faint rounded text-[11px] bg-white w-20"
                  />
                  <input
                    type="date"
                    value={row.due_date}
                    onChange={(e) => setBulkRows((prev) => prev.map((r, idx) => idx === i ? { ...r, due_date: e.target.value } : r))}
                    className="p-1.5 border border-ink-faint rounded text-[11px] bg-white"
                  />
                  {bulkRows.length > 1 && (
                    <button type="button" onClick={() => setBulkRows((prev) => prev.filter((_, idx) => idx !== i))} className="px-1.5 py-1 border border-ink-faint rounded text-ink-muted">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBulkRows((prev) => [...prev, { alias_id: '', amount: '', due_date: '' }])}
              className="w-full py-1.5 border border-dashed border-ink-faint rounded text-ink-muted"
            >
              + Add Row
            </button>
            <button
              onClick={() => createBulkMutation.mutate()}
              disabled={createBulkMutation.isPending}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
            >
              Send Bulk Invoices
            </button>
          </div>
        </Card>
      </div>

      <Card title="Invoices">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                <th className="py-2 px-3">Invoice #</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Due Date</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {isInvoicesLoading ? (
                <tr><td colSpan={5} className="py-6 text-center text-ink-muted">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-ink-muted">No invoices sent yet.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-1">
                    <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{inv.invoice_number}</td>
                    <td className="py-2.5 px-3 text-right font-mono">KES {Number(inv.amount ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-ink-muted">{inv.due_date}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={STATUS_VARIANT[inv.status] ?? 'neutral'}>{inv.status}</Badge>
                      {!!inv.failure_reason && <div className="text-red-600 text-[10px] mt-0.5">{inv.failure_reason}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{inv.paid_at ? new Date(inv.paid_at).toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
