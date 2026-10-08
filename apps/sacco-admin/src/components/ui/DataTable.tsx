import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T, index: number) => string
}

export function DataTable<T>({ columns, data, loading = false, emptyMessage = 'No data available.', keyExtractor }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-[#e5ede9] bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e5ede9] bg-surface-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {columns.map((column) => (
              <th key={column.key} className="py-2.5 px-3" style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5ede9]">
          {loading ? (
            <tr><td colSpan={columns.length} className="py-8 text-center text-sm text-ink-muted">Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-8 text-center text-sm text-ink-muted">{emptyMessage}</td></tr>
          ) : (
            data.map((row, index) => (
              <tr key={keyExtractor(row, index)} className="hover:bg-surface-1 transition-colors">
                {columns.map((column) => (
                  <td key={`${keyExtractor(row, index)}-${column.key}`} className="py-2.5 px-3 align-middle">
                    {column.render(row)}
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
