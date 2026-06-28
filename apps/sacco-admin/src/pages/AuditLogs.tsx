import { useState } from 'react'
import { useAuditLogs } from '../hooks/useAuditLogs'

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: 'bg-mint-50', color: 'text-mint-700' },
  UPDATE: { bg: 'bg-blue-50', color: 'text-blue-700' },
  DELETE: { bg: 'bg-red-50', color: 'text-red-700' },
  APPROVE: { bg: 'bg-mint-50', color: 'text-mint-700' },
  REJECT: { bg: 'bg-red-50', color: 'text-red-700' },
  LOGIN: { bg: 'bg-violet-50', color: 'text-violet-700' },
}

export function AuditLogs() {
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const { data, isLoading } = useAuditLogs({ action: actionFilter || undefined, resource_type: resourceFilter || undefined })

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Audit Logs</div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total entries
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            type="text"
            placeholder="Filter by resource..."
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No audit logs found.</div>
      )}

      {isLoading ? (
        [1, 2, 3].map((i) => <div key={i} className="h-[80px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-surface-3">
              <tr>
                <th className="text-left text-xs font-semibold text-ink-soft px-4 py-2">Timestamp</th>
                <th className="text-left text-xs font-semibold text-ink-soft px-4 py-2">User</th>
                <th className="text-left text-xs font-semibold text-ink-soft px-4 py-2">Action</th>
                <th className="text-left text-xs font-semibold text-ink-soft px-4 py-2">Resource</th>
                <th className="text-left text-xs font-semibold text-ink-soft px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data?.results ?? []).map((log: any) => {
                const ac = ACTION_COLORS[log.action] || { bg: 'bg-surface-2', color: 'text-ink' }
                return (
                  <tr key={log.id} className="border-b border-surface-3 hover:bg-surface-1">
                    <td className="px-4 py-2 text-xs text-ink-muted">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-ink">{log.user || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`${ac.bg} ${ac.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-ink">
                      {log.resource_type} ({log.resource_id})
                    </td>
                    <td className="px-4 py-2 text-xs text-ink-muted max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
