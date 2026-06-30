type HealthStatus = 'healthy' | 'good' | 'warning' | 'review' | 'critical' | 'api_issue' | 'operational' | 'degraded' | 'disconnected'

interface HealthDotProps {
  status: HealthStatus | string
  label?: string
}

const dotColors: Record<string, string> = {
  healthy: 'bg-mint-500',
  good: 'bg-mint-500',
  operational: 'bg-mint-500',
  warning: 'bg-amber-500',
  review: 'bg-amber-500',
  degraded: 'bg-amber-500',
  critical: 'bg-red-500',
  api_issue: 'bg-red-500',
  disconnected: 'bg-red-500',
}

const textColors: Record<string, string> = {
  healthy: 'text-mint-700',
  good: 'text-mint-700',
  operational: 'text-mint-700',
  warning: 'text-amber-700',
  review: 'text-amber-700',
  degraded: 'text-amber-700',
  critical: 'text-red-800',
  api_issue: 'text-red-800',
  disconnected: 'text-red-800',
}

export function HealthDot({ status, label }: HealthDotProps) {
  const normalized = String(status).toLowerCase()
  const dot = dotColors[normalized] ?? 'bg-ink-muted'
  const text = textColors[normalized] ?? 'text-ink-muted'

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className={`text-xs ${text}`}>{label ?? status}</span>
    </div>
  )
}
