type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'violet'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-mint-50 text-mint-700 border border-mint-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  neutral: 'bg-surface-2 text-ink-muted border border-[#e5ede9]',
  violet: 'bg-violet-50 text-violet-700 border border-violet-200',
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[variant]}`}>{children}</span>
}
