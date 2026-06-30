type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'violet'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-mint-50 text-mint-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-800',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-surface-2 text-ink-muted',
  violet: 'bg-violet-50 text-violet-700',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
