import { IconCheck } from './icons'

type IconComponent = (props: { className?: string }) => JSX.Element

type FeatureSectionProps = {
  id: string
  icon: IconComponent
  eyebrow: string
  title: string
  intro: string
  features: string[]
  tone?: 'white' | 'surface'
}

// The repeated "capability block" pattern for the Platform and Security
// pages — icon + heading + intro paragraph + a scannable feature list.
// Alternating tone (white/surface) between sections on the same page gives
// visual rhythm without needing a different layout per section.
export function FeatureSection({ id, icon: Icon, eyebrow, title, intro, features, tone = 'white' }: FeatureSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 border-b border-rule py-16 ${tone === 'surface' ? 'bg-surface' : 'bg-white'}`}
    >
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] bg-violet/10">
              <Icon className="h-5 w-5 text-violet" />
            </div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-violet">{eyebrow}</div>
            <h2 className="font-serif text-[1.7rem] leading-tight text-ink">{title}</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">{intro}</p>
          </div>
          <ul className="grid gap-3 self-start sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex gap-2.5 rounded-lg border border-rule bg-white p-4 text-[13px] leading-snug text-ink-soft">
                <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
