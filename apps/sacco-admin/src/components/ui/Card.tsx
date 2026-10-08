import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padding?: 'normal' | 'none'
}

export function Card({ title, action, children, className = '', padding = 'normal' }: CardProps) {
  return (
    <section className={`bg-white border border-[#e5ede9] rounded-[10px] shadow-sm ${padding === 'normal' ? 'p-5' : ''} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
