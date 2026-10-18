type IconProps = { className?: string }

const base = 'stroke-current fill-none'

export function IconLink({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 15 15 9" />
        <path d="M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5" />
        <path d="M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5" />
      </g>
    </svg>
  )
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M15.3 14c2.4.2 4.2 1.9 4.2 4.5" />
      </g>
    </svg>
  )
}

export function IconScore({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18V11" />
        <path d="M10 18V6" />
        <path d="M16 18v-9" />
        <path d="M20 18V3" />
        <path d="M3 20.5h18" />
      </g>
    </svg>
  )
}

export function IconPortfolio({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5.5" y="3.5" width="13" height="17" rx="2.2" />
        <path d="M9 7.5h6" />
        <path d="M9 11.5h6" />
        <path d="M9 15.5h3.5" />
      </g>
    </svg>
  )
}

export function IconLedger({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="4" width="15" height="16" rx="1.6" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </g>
    </svg>
  )
}

export function IconFourEyes({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="8" cy="10" rx="4.2" ry="3" />
        <circle cx="8" cy="10" r="1.1" />
        <ellipse cx="17" cy="15" rx="4.2" ry="3" />
        <circle cx="17" cy="15" r="1.1" />
      </g>
    </svg>
  )
}

export function IconChainHash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="9.5" width="6" height="6" rx="1.4" />
        <rect x="14.5" y="9.5" width="6" height="6" rx="1.4" />
        <path d="M9.5 12.5h5" />
      </g>
    </svg>
  )
}

export function IconArchive({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4.5" width="16" height="4" rx="1.2" />
        <path d="M5.5 8.5v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9" />
        <path d="M10 13h4" />
      </g>
    </svg>
  )
}

export function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" />
        <path d="M9.3 12 11.3 14l3.4-4" />
      </g>
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.7}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M19 19l-4.3-4.3" />
      </g>
    </svg>
  )
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.8}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 12h15" />
        <path d="M13.5 6.5 19 12l-5.5 5.5" />
      </g>
    </svg>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5 9.5 17 19 7" />
      </g>
    </svg>
  )
}

export function IconDesktop({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="4.5" width="17" height="11" rx="1.5" />
        <path d="M9 19.5h6" />
        <path d="M12 15.5v4" />
      </g>
    </svg>
  )
}

export function IconPaperStack({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3.5h8l3 3v13.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
        <path d="M15 3.5V6a1 1 0 0 0 1 1h2.5" />
        <path d="M9 12h6" />
        <path d="M9 15.5h6" />
      </g>
    </svg>
  )
}

export function IconSplit({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5h3.3a2 2 0 0 1 1.8 1.1L12 9" />
        <path d="M5 19h3.3a2 2 0 0 0 1.8-1.1L12 15" />
        <path d="M12 9l1.9-2.9A2 2 0 0 1 15.7 5H19" />
        <path d="M12 15l1.9 2.9a2 2 0 0 0 1.8 1.1H19" />
        <path d="M16 2.5 19 5l-3 2.5" />
        <path d="M16 21.5 19 19l-3-2.5" />
      </g>
    </svg>
  )
}
