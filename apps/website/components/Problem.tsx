import { SectionLabel } from './SectionLabel'
import { IconDesktop, IconPaperStack, IconSplit } from './icons'

const PAIN_POINTS = [
  {
    icon: IconDesktop,
    title: 'Locked to one desk, one desktop',
    body: 'Core software that only runs on the office PC means members queue for updates the branch could post from a phone, and the board waits weeks for numbers that should take minutes.',
  },
  {
    icon: IconPaperStack,
    title: 'Reconciliation by hand',
    body: 'M-Pesa statements, bank slips and a ledger spreadsheet, matched line by line at month-end. One transposed figure and the whole close slips another day.',
  },
  {
    icon: IconSplit,
    title: 'Every SACCO flying blind on its own',
    body: 'A member can be mid-default at one SACCO while a second approves them for a fresh loan the same week — no software built for a single institution can see across the fence.',
  },
]

export function Problem() {
  return (
    <section className="border-b border-rule py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>The problem</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          Most SACCOs are still run the way they were in <em className="italic">2009</em>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          22,000+ cooperatives in Kenya hold savings, issue loans and pay dividends the same way a
          commercial bank does — on infrastructure a commercial bank would never accept.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-tile border border-rule sm:grid-cols-3">
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className="bg-surface p-7">
              <p.icon className="mb-5 h-7 w-7 text-violet" />
              <div className="mb-2 text-[15px] font-semibold text-ink">{p.title}</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
