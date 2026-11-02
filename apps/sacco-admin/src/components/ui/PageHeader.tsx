import { ReactNode } from 'react'
import { InfoTip } from '@saccosphere/ui'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** A plain-language explanation of what this page is for, shown in a hover/click/focus popover next to the title. Use it for the "why", when the subtitle already states the "what". */
  info?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, info, actions }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="flex items-center gap-1.5">
          <div className="text-xl font-bold text-ink">{title}</div>
          {info && <InfoTip text={info} label={`About ${title}`} />}
        </div>
        {subtitle && <div className="text-xs text-ink-muted mt-0.5">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
