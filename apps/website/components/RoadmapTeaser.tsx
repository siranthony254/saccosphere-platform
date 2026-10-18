import { SectionLabel } from './SectionLabel'

const PHASES = [
  { phase: 'Now', title: 'FOSA-grade banking feel', body: 'Paybill deposits, M-Pesa withdrawals, internal transfers, repayment reminders.' },
  { phase: 'Next', title: 'Sector-built verticals', body: 'Agricultural, transport and housing SACCOs, each with tools built for how they actually lend.' },
  { phase: 'Then', title: 'An intelligence layer', body: 'A cooperative credit score, fraud detection across SACCOs, and 90-day-ahead default warnings.' },
  { phase: 'With partners', title: 'Cards, interbank rails, insurance', body: 'The items that need a regulated partner, not just code — scoped honestly, not oversold.' },
]

export function RoadmapTeaser() {
  return (
    <section className="border-b border-rule py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>Built today, designed to grow</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          What&rsquo;s running now is the <em className="italic">foundation</em>, not the ceiling
        </h2>

        <div
          className="mt-12 grid gap-px overflow-hidden rounded-tile border border-rule"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {PHASES.map((p) => (
            <div key={p.title} className="bg-surface p-6">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet">{p.phase}</div>
              <div className="mb-2 text-[14px] font-semibold text-ink">{p.title}</div>
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
