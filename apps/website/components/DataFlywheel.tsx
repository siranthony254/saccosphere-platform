const STEPS = [
  { label: 'More SACCOs join', angle: -90 },
  { label: 'More signal in the network', angle: 0 },
  { label: 'Better credit decisions', angle: 90 },
  { label: 'Cheaper to run, per SACCO', angle: 180 },
]

// A simple circular flywheel diagram — four nodes around a circle with
// arrows chasing each other, rendered as inline SVG so it stays crisp at
// any size and needs no image asset.
export function DataFlywheel() {
  const radius = 130
  const center = 160

  const points = STEPS.map((s) => {
    const rad = (s.angle * Math.PI) / 180
    return {
      ...s,
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    }
  })

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 320 320" className="h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]">
        <circle cx={center} cy={center} r={radius} className="fill-none stroke-rule" strokeWidth={1.5} strokeDasharray="2 6" />
        {points.map((p, i) => {
          const next = points[(i + 1) % points.length]
          const midX = (p.x + next.x) / 2
          const midY = (p.y + next.y) / 2
          const dx = next.x - p.x
          const dy = next.y - p.y
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI
          return (
            <g key={`arrow-${i}`}>
              <polygon
                points="-5,-4 5,0 -5,4"
                transform={`translate(${midX}, ${midY}) rotate(${angle})`}
                className="fill-violet/50"
              />
            </g>
          )
        })}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={7} className="fill-mint" />
        ))}
        <circle cx={center} cy={center} r={44} className="fill-violet/[0.06] stroke-violet/20" strokeWidth={1} />
        <text x={center} y={center - 4} textAnchor="middle" className="fill-violet text-[11px] font-semibold">
          The
        </text>
        <text x={center} y={center + 12} textAnchor="middle" className="fill-violet text-[11px] font-semibold">
          flywheel
        </text>
      </svg>

      <div className="mt-2 grid max-w-md grid-cols-2 gap-3 text-center">
        {STEPS.map((s) => (
          <div key={s.label} className="rounded-lg border border-rule bg-white px-3 py-2.5 text-[12px] font-medium text-ink-soft">
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
