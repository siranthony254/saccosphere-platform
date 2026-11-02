import { ReactNode } from 'react'
import { InfoTip } from '@saccosphere/ui'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** A plain-language explanation of what this page is for, shown in a hover/click/focus popover next to the title. Use this for the "why" when the subtitle already states the "what". */
  info?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, info, actions }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-5">
      <div>
        <div className="flex items-center gap-1.5">
          <div className="text-lg font-semibold text-ink">{title}</div>
          {info && <InfoTip text={info} label={`About ${title}`} />}
        </div>
        {subtitle && <div className="text-xs text-ink-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
