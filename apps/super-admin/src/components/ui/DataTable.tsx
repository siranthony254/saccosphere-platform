import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T, index: number) => string
  rowClassName?: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  page?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available.',
  keyExtractor,
  rowClassName,
  onRowClick,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-2">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center text-ink-muted">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center text-ink-muted text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                className={`border-b border-surface-2 ${
                  index % 2 === 0 ? 'bg-surface' : 'bg-surface-2'
                } ${onRowClick ? 'cursor-pointer hover:bg-violet-50/50' : ''} ${rowClassName?.(row, index) ?? ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-2.5 px-3 align-middle">
                    {col.render ? col.render(row, index) : (
                      <span>{String((row as any)[col.key] ?? '')}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {typeof page === 'number' && typeof pageSize === 'number' && typeof totalItems === 'number' && onPageChange && (
        <div className="flex items-center justify-between gap-3 border-t border-mid bg-surface-2 px-3 py-2 text-xs text-ink-muted">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-mid bg-surface px-2.5 py-1.5 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-mid bg-surface px-2.5 py-1.5 disabled:opacity-40"
              disabled={page * pageSize >= totalItems}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
