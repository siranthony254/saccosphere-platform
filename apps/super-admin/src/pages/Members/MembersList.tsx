import { useState } from 'react'
import { useAllMembers, useAllSaccos } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import type { PlatformMember } from '@saccosphere/schemas'

function kycVariant(status: string | null | undefined): 'success' | 'warning' | 'error' | 'neutral' {
  const s = String(status ?? 'unknown').toLowerCase()
  if (s === 'verified' || s === 'approved') return 'success'
  if (s === 'pending' || s === 'under_review') return 'warning'
  if (s === 'rejected') return 'error'
  return 'neutral'
}

export function MembersList() {
  const [search, setSearch] = useState('')
  const [saccoFilter, setSaccoFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useAllMembers({
    search: search || undefined,
    sacco: saccoFilter || undefined,
    page,
  })
  const { data: saccosData } = useAllSaccos()

  return (
    <div className="p-5">
      <PageHeader
        title="All members"
        subtitle={`${data?.count ?? 0} total members`}
      />

      <p className="text-[11px] text-ink-faint mb-3">
        Platform-wide directory. Per-member detail (savings, loans, transactions) is SACCO-scoped
        on the backend and isn't exposed to platform admins — use the SACCO admin console for that.
      </p>

      <div className="flex gap-2.5 mb-4">
        <input
          className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={saccoFilter}
          onChange={(e) => { setSaccoFilter(e.target.value); setPage(1) }}
        >
          <option value="">All SACCOs</option>
          {(saccosData?.results ?? []).map((sacco: any) => (
            <option key={sacco.id} value={sacco.id}>
              {sacco.name}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-[10px]">
          Failed to load members.
          <button onClick={() => refetch()} className="ml-2 text-red-700 underline">
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: 'member',
              header: 'Member',
              render: (row: PlatformMember) => (
                <div>
                  <div className="font-medium text-ink">{row.full_name}</div>
                  <div className="text-[10px] text-ink-faint">{row.email}</div>
                </div>
              ),
            },
            {
              key: 'phone_number',
              header: 'Phone',
              render: (row: PlatformMember) => (
                <span className="text-ink-muted">{row.phone_number || '—'}</span>
              ),
            },
            {
              key: 'kyc_status',
              header: 'KYC',
              render: (row: PlatformMember) => <Badge variant={kycVariant(row.kyc_status)}>{row.kyc_status ?? 'Unknown'}</Badge>,
            },
            {
              key: 'member_since',
              header: 'Member since',
              render: (row: PlatformMember) =>
                row.member_since ? new Date(row.member_since).toLocaleDateString() : '—',
            },
          ]}
          data={data?.results ?? []}
          loading={isLoading}
          emptyMessage={
            search
              ? 'No members match your search.'
              : 'No approved members found. Check back once members are approved by their respective SACCOs.'
          }
          keyExtractor={(row: PlatformMember) => row.id}
        />
      )}

      {data && data.count > 0 && (
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-ink-muted">
            Page {page} · showing {data.results.length} of {data.count} total members
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border border-mid rounded-lg text-[13px] bg-surface disabled:opacity-40"
              disabled={!data.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <button
              className="px-3 py-1.5 border border-mid rounded-lg text-[13px] bg-surface disabled:opacity-40"
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
