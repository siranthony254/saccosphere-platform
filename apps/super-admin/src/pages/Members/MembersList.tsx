import { useState, useMemo } from 'react'
import { useAllMembers } from '../../hooks/usePlatformData'
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
  const [kycFilter, setKycFilter] = useState('all')

  const { data, isLoading, isError, refetch } = useAllMembers({
    search: search || undefined,
    kyc_status: kycFilter === 'all' ? undefined : kycFilter,
  })

  const kycOptions = useMemo(() => {
    const set = new Set<string>()
    ;(data?.results ?? []).forEach((m: PlatformMember) => {
      if (m.kyc_status) set.add(m.kyc_status)
    })
    return Array.from(set).sort()
  }, [data?.results])

  return (
    <div className="p-5">
      <PageHeader
        title="All members"
        subtitle={`${data?.count ?? 0} total members`}
      />

      <div className="flex gap-2.5 mb-4">
        <input
          className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search by name, ID, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
        >
          <option value="all">All KYC statuses</option>
          {kycOptions.map((status) => (
            <option key={status} value={status}>
              {status}
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
          emptyMessage={search || kycFilter !== 'all' ? 'No members match your filters.' : 'No members found on the platform.'}
          keyExtractor={(row: PlatformMember) => row.id}
        />
      )}

      {data && data.count > 0 && (
        <div className="text-xs text-ink-muted mt-2 text-right">
          Showing {data.results.length} of {data.count} total members
        </div>
      )}
    </div>
  )
}
