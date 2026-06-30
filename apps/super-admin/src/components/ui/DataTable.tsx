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
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available.',
  keyExtractor,
  rowClassName,
  onRowClick,
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
                    {col.render ? col.render(row, index) : (row as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
