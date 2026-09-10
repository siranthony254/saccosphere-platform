import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import {
  useDisbursementDisputes,
  useDisbursementAudit,
  type DisbursementDispute,
} from '../../hooks/useDisbursementDisputes'

function formatKes(value: number): string {
  return `KES ${Number(value || 0).toLocaleString('en-KE')}`
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-KE')
}

function statusVariant(status: string): 'error' | 'warning' | 'neutral' {
  const s = status.toUpperCase()
  if (s === 'DISPUTED') return 'error'
  if (s === 'UNDER_REVIEW') return 'warning'
  return 'neutral'
}

export function DisbursementDisputes() {
  const { data: disputes, isLoading, error } = useDisbursementDisputes()
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const { data: audit, isLoading: auditLoading } = useDisbursementAudit(selectedLoanId)

  const rows = disputes ?? []
  const selected = rows.find((r) => r.loan_id === selectedLoanId) ?? null

  return (
    <div className="p-5">
      <PageHeader
        title="Disbursement Disputes"
        subtitle="Loans a member reported as not received — needs platform investigation"
      />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard
          label="Open disputes"
          value={String(rows.length)}
          delta={rows.length ? 'DISPUTED / UNDER_REVIEW' : 'Nothing outstanding'}
          accent={rows.length > 0}
        />
        <MetricCard
          label="Total amount in dispute"
          value={formatKes(rows.reduce((sum, r) => sum + r.amount, 0))}
          delta="Across all open disputes"
        />
      </div>

      <p className="text-[11px] text-ink-faint mb-3">
        Read-only. A member raises a dispute from the disbursement-confirmation link; it clears
        when the member confirms receipt, or when the SACCO re-runs the M-Pesa B2C payout.
        There is no resolve action here — use the audit trail to investigate.
      </p>

      <Card title="Open disputes" padding="none">
        {error ? (
          <div className="text-xs text-red-600 p-4">
            Could not load disputes{(error as { status?: number })?.status === 403 ? ' (super-admin role required).' : '.'}
          </div>
        ) : (
          <DataTable<DisbursementDispute>
            loading={isLoading}
            emptyMessage="No disbursement disputes."
            data={rows}
            keyExtractor={(row) => row.loan_id}
            onRowClick={(row) => setSelectedLoanId(row.loan_id)}
            rowClassName={(row) =>
              row.loan_id === selectedLoanId ? 'bg-violet-50' : ''
            }
            columns={[
              { key: 'sacco', header: 'SACCO', render: (row) => row.sacco },
              { key: 'member', header: 'Member', render: (row) => row.member },
              {
                key: 'amount',
                header: 'Amount',
                render: (row) => formatKes(row.amount),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={statusVariant(row.status)}>{row.status || '—'}</Badge>
                ),
              },
              {
                key: 'disputed_at',
                header: 'Disputed',
                render: (row) => formatDateTime(row.disputed_at),
              },
              {
                key: 'dispute_reason',
                header: 'Reason',
                render: (row) => (
                  <div className="max-w-64 overflow-hidden text-ellipsis whitespace-nowrap text-ink-muted">
                    {row.dispute_reason || '—'}
                  </div>
                ),
              },
              {
                key: 'audit_log_count',
                header: 'Audit',
                render: (row) => `${row.audit_log_count} entr${row.audit_log_count === 1 ? 'y' : 'ies'}`,
              },
            ]}
          />
        )}
      </Card>

      {selected && (
        <Card
          title={`Disbursement audit trail — ${selected.member} · ${formatKes(selected.amount)}`}
          action={
            <button
              onClick={() => setSelectedLoanId(null)}
              className="text-[11px] text-ink-muted hover:text-ink"
            >
              Close
            </button>
          }
          className="mt-4"
        >
          {auditLoading ? (
            <div className="text-xs text-ink-muted">Loading audit trail…</div>
          ) : !audit ? (
            <div className="text-xs text-ink-muted">No audit data returned.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <div className="text-ink-faint uppercase tracking-wide">Current status</div>
                  <div className="text-ink font-medium mt-0.5">{audit.current_status || '—'}</div>
                </div>
                <div>
                  <div className="text-ink-faint uppercase tracking-wide">M-Pesa conversation</div>
                  <div className="text-ink font-medium mt-0.5 break-all">
                    {audit.mpesa_conversation_id || selected.mpesa_conversation_id || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-ink-faint uppercase tracking-wide">M-Pesa transaction</div>
                  <div className="text-ink font-medium mt-0.5 break-all">
                    {audit.mpesa_transaction_id || '—'}
                  </div>
                </div>
              </div>

              {audit.audit_log.length === 0 ? (
                <div className="text-xs text-ink-muted">No audit-log entries recorded.</div>
              ) : (
                <DataTable
                  data={audit.audit_log}
                  keyExtractor={(_row, i) => String(i)}
                  columns={[
                    { key: 'event', header: 'Event', render: (r: { event: string }) => r.event || '—' },
                    { key: 'actor_role', header: 'Actor', render: (r: { actor_role: string }) => r.actor_role || '—' },
                    { key: 'mpesa_ref', header: 'M-Pesa ref', render: (r: { mpesa_ref: string }) => r.mpesa_ref || '—' },
                    {
                      key: 'created_at',
                      header: 'When',
                      render: (r: { created_at: string | null }) => formatDateTime(r.created_at),
                    },
                    {
                      key: 'details',
                      header: 'Details',
                      render: (r: { details: unknown }) => (
                        <div className="max-w-80 overflow-hidden text-ellipsis whitespace-nowrap text-ink-muted">
                          {r.details ? JSON.stringify(r.details) : '—'}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
