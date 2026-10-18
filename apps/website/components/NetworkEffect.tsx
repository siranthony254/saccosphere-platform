import { SectionLabel } from './SectionLabel'
import { IconLink, IconUsers, IconScore, IconPortfolio } from './icons'

const EFFECTS = [
  {
    icon: IconLink,
    title: 'Cross-SACCO debt visibility',
    body: 'A loan officer at Stima sees a member’s outstanding balance at Teachers before approving a second loan. No single-SACCO system can show this — it doesn’t have a second SACCO to look at.',
  },
  {
    icon: IconUsers,
    title: 'A shared guarantor network',
    body: 'A member on any SACCO in the network can be guaranteed by a member of any other. A typical guarantor pool of a few thousand becomes the whole network — the single biggest cause of loan rejection, gone.',
  },
  {
    icon: IconScore,
    title: 'A cooperative credit score',
    body: 'Credit bureaus record defaults. SaccoSphere records six years of on-time contributions across two SACCOs without a missed month — the positive signal most members have never had a way to prove.',
  },
  {
    icon: IconPortfolio,
    title: 'A member’s whole cooperative life, in one place',
    body: 'Total savings, every loan, every dividend, across every SACCO — on one phone, for the first time. Not a feature. A category that didn’t exist before this network did.',
  },
]

export function NetworkEffect() {
  return (
    <section id="network" className="border-b border-rule bg-surface py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>Why the network matters</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          What no single-SACCO system can <em className="italic">ever copy</em>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Every legacy SACCO system is built to solve problems inside one institution. These four
          capabilities only exist because more than one SACCO shares the same platform —
          copying the screen is easy; copying the network underneath it is not.
        </p>

        <div
          className="mt-12 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {EFFECTS.map((e) => (
            <div key={e.title} className="rounded-card border border-rule bg-white p-7">
              <e.icon className="mb-5 h-7 w-7 text-mint" />
              <div className="mb-3 text-[15px] font-semibold leading-snug text-ink">{e.title}</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">{e.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
