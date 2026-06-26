import { useState } from 'react'
import { useAuditLogs } from '../../hooks/useAuditLogs'

export function AuditLogs() {
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')

  const { data: logs, isLoading } = useAuditLogs(
    action || resourceType ? { action, resource_type: resourceType } : undefined
  )

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">System Audit Logs</div>
          <div className="text-xs text-ink-muted">Platform-wide audit trail (SUPER_ADMIN only)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <input
          className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Filter by action..."
          value={action}
          onChange={e => setAction(e.target.value)}
        />
        <input
          className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Filter by resource type..."
          value={resourceType}
          onChange={e => setResourceType(e.target.value)}
        />
      </div>

      {/* Logs table */}
      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['Timestamp', 'User', 'Action', 'Resource', 'Details'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-muted">Loading audit logs...</td>
              </tr>
            ) : !logs || logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-muted">No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="border-b border-surface-2">
                  <td className="py-2.5 px-3 text-ink-muted text-xs">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    {log.user?.email || log.user?.first_name || 'System'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ink-muted text-xs">{log.resource_type || '—'}</td>
                  <td className="py-2.5 px-3 text-ink-muted text-xs max-w-xs truncate">
                    {log.details || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
