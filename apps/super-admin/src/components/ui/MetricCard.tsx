interface MetricCardProps {
  label: string
  value: string
  delta?: string
  accent?: boolean
  className?: string
}

export function MetricCard({ label, value, delta, accent = false, className = '' }: MetricCardProps) {
  return (
    <div
      className={`rounded-[10px] py-[14px] px-4 ${
        accent
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-none'
          : 'bg-surface border border-mid'
      } ${className}`}
    >
      <div
        className={`text-[10px] mb-1.5 uppercase tracking-[0.04em] font-medium ${
          accent ? 'text-white/60' : 'text-ink-muted'
        }`}
      >
        {label}
      </div>
      <div className={`text-[22px] font-semibold leading-none mb-1 ${accent ? 'text-white' : 'text-ink'}`}>
        {value}
      </div>
      {delta && (
        <div className={`text-[11px] ${accent ? 'text-mint-300' : 'text-mint-700'}`}>{delta}</div>
      )}
    </div>
  )
}
