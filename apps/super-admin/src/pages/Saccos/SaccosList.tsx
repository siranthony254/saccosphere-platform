import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllSaccos } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { SaccoAvatar, SaccoHealthDot, SaccoStatusBadge } from '../../components/saccos'
import type { SuperAdminSacco } from '@saccosphere/schemas'

export function SaccosList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useAllSaccos({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
  })

  return (
    <div className="p-5">
      <PageHeader
        title="All SACCOs"
        subtitle={`${data?.count ?? 0} SACCOs on the platform`}
      />

      <div className="flex gap-2.5 mb-4">
        <input
          className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search SACCO name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <DataTable
        columns={[
          {
            key: 'sacco',
            header: 'SACCO',
            render: (row: SuperAdminSacco) => (
              <div className="flex items-center gap-2.5">
                <SaccoAvatar name={row.name} color={row.color} initials={row.initials} />
                <div>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-[10px] text-ink-faint">{row.sasra_reg_no || 'No SASRA reg'}</div>
                </div>
              </div>
            ),
          },
          { key: 'sector', header: 'Sector', render: (row: SuperAdminSacco) => row.sector || 'SACCO' },
          {
            key: 'member_count',
            header: 'Members',
            render: (row: SuperAdminSacco) => row.member_count.toLocaleString(),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row: SuperAdminSacco) => <SaccoStatusBadge isActive={row.is_active} />,
          },
          {
            key: 'health',
            header: 'Health',
            render: (row: SuperAdminSacco) => <SaccoHealthDot status={row.health_status} />,
          },
          {
            key: 'last_transaction_at',
            header: 'Last transaction',
            render: (row: SuperAdminSacco) =>
              row.last_transaction_at ? new Date(row.last_transaction_at).toLocaleDateString() : '—',
          },
        ]}
        data={data?.results ?? []}
        loading={isLoading}
        emptyMessage="No SACCOs match your filters."
        keyExtractor={(row: SuperAdminSacco) => row.id}
        onRowClick={(row: SuperAdminSacco) => navigate(`/saccos/${row.id}`)}
      />
    </div>
  )
}
