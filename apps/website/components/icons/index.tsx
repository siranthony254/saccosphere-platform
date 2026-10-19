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

export function IconBuilding({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3.5" width="10" height="17" rx="1.3" />
        <path d="M15 10.5h4v10h-4" />
        <path d="M8 7.5h1.2M11.8 7.5H13M8 11h1.2M11.8 11H13M8 14.5h1.2M11.8 14.5H13" />
      </g>
    </svg>
  )
}

export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12.5" r="8" />
        <path d="M12 8v4.5l3 2" />
      </g>
    </svg>
  )
}

export function IconHeartHand({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8.2c-1-1.6-3.5-1.8-4.6-.4-1.1 1.4-.7 3 .6 4.2l4 3.6 4-3.6c1.3-1.2 1.7-2.8.6-4.2-1.1-1.4-3.6-1.2-4.6.4Z" />
        <path d="M4 19.5c1-.9 2.2-1.4 3.6-1.4h4.9c.9 0 1.7-.3 2.3-.9l2.6-2.4a1.2 1.2 0 0 1 1.7 1.7l-2.1 2.1c-1 1-2.4 1.6-3.8 1.6H8" />
      </g>
    </svg>
  )
}

export function IconDoorExit({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 3.5H6.5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1H11" />
        <path d="M14.5 8 19 12l-4.5 4" />
        <path d="M19 12H9.5" />
      </g>
    </svg>
  )
}

export function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
        <path d="M4.5 7 12 13l7.5-6" />
      </g>
    </svg>
  )
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.6}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.5v11" />
        <path d="M7.5 10.5 12 15l4.5-4.5" />
        <path d="M4.5 18.5h15" />
      </g>
    </svg>
  )
}

export function IconBriefcase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="8" width="17" height="11" rx="1.6" />
        <path d="M8.5 8V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2" />
        <path d="M3.5 13h17" />
        <path d="M10.8 13h2.4v1.8h-2.4Z" />
      </g>
    </svg>
  )
}

export function IconTarget({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4.3" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}

export function IconCalendarSteps({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="15" rx="1.6" />
        <path d="M4 9.5h16" />
        <path d="M8 3v3.5M16 3v3.5" />
        <path d="M8 13.5h2M14 13.5h2M8 16.8h2" />
      </g>
    </svg>
  )
}

export function IconScale({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v15.5" />
        <path d="M7.5 20h9" />
        <path d="M12 6.5 5 8l3.3 6.3a3.6 3.6 0 0 0 7.4 0L19 8l-7-1.5Z" />
      </g>
    </svg>
  )
}

export function IconPhoneCall({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 4.5h3l1.4 4-2 1.6a11 11 0 0 0 5.9 5.9l1.6-2 4 1.4v3a1.5 1.5 0 0 1-1.6 1.5C10.9 19.4 4.6 13.1 4 6.1a1.5 1.5 0 0 1 1.5-1.6Z" />
      </g>
    </svg>
  )
}

export function IconSend({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.6}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12 20 4 15 20l-3.5-5.5L4 12Z" />
        <path d="M11.5 14.5 20 4" />
      </g>
    </svg>
  )
}

export function IconFile({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3.5h8l3 3v13.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
        <path d="M15 3.5V6a1 1 0 0 0 1 1h2.5" />
        <path d="M9 13h6M9 16.5h6" />
      </g>
    </svg>
  )
}

export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 10.5a6 6 0 0 1 12 0v4l1.5 2.5h-15L6 14.5Z" />
        <path d="M10 19.5a2 2 0 0 0 4 0" />
      </g>
    </svg>
  )
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={1.5}>
      <g className={base} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20.5V4" />
        <path d="M6 5h11l-2.5 3.5L17 12H6" />
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
