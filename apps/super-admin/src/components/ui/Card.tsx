import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  action?: ReactNode
  className?: string
  padding?: 'none' | 'normal'
}

export function Card({ children, title, action, className = '', padding = 'normal' }: CardProps) {
  return (
    <div className={`bg-surface border border-mid rounded-[10px] ${padding === 'normal' ? 'p-4' : ''} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <div className="font-semibold text-[13px] text-ink">{title}</div>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
