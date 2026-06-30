interface SaccoAvatarProps {
  name: string
  color?: string | null
  initials?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-[9px] rounded-full',
  md: 'w-8 h-8 text-[11px] rounded-lg',
  lg: 'w-[52px] h-[52px] text-xl rounded-xl',
}

function getInitials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, max)
}

export function SaccoAvatar({ name, color, initials, size = 'md' }: SaccoAvatarProps) {
  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 ${sizeClasses[size]}`}
      style={{ background: color || '#6D28D9' }}
    >
      {initials || getInitials(name)}
    </div>
  )
}
