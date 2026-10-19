import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import { DataFlywheel } from '@/components/DataFlywheel'
import { IconLink, IconUsers, IconScore, IconPortfolio } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Network',
  description: 'What one shared network makes possible that no single-SACCO system ever can.',
}

const CANT_FOLLOW = [
  'Show a member’s full SACCO life across multiple institutions',
  'Build a cross-SACCO reputation or credit score',
  'Create a neutral SACCO discovery experience',
  'Detect a fraud ring operating across more than one SACCO',
  'Generate a shared guarantor network effect',
  'Lower per-SACCO infrastructure cost through shared scale',
]

export default function NetworkPage() {
  return (
    <main>
      <PageHero
        eyebrow="The network"
        title="What one shared network makes possible"
        subtitle="Every legacy SACCO system is built to solve problems inside one institution. These four capabilities exist only because more than one SACCO shares this platform."
      />

      {/* Cross-SACCO debt visibility */}
      <section className="border-b border-rule py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-violet/10">
              <IconLink className="h-6 w-6 text-violet" />
            </div>
            <div>
              <h2 className="font-serif text-[1.6rem] text-ink">Cross-SACCO debt visibility</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
                A loan officer approving a second loan sees the member&rsquo;s outstanding balance at
                every other SACCO on the network first. No single-institution system can show
                this — it doesn&rsquo;t have a second SACCO to look at.
              </p>
              <div className="mt-5 max-w-xl rounded-card border border-violet/20 bg-violet/[0.04] p-5">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-violet">Worked example</div>
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  A member takes a loan at Stima SACCO, falls behind, and applies for a second
                  loan at Teachers SACCO the same month. On a single-SACCO system, Teachers sees
                  a clean record. On the network, Teachers&rsquo; underwriter sees the Stima exposure
                  before approving — the single most effective NPL-reduction tool available to
                  either SACCO alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantor network */}
      <section className="border-b border-rule bg-surface py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-mint/10">
              <IconUsers className="h-6 w-6 text-mint" />
            </div>
            <div>
              <h2 className="font-serif text-[1.6rem] text-ink">A shared guarantor network</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
                A member on any SACCO in the network can be guaranteed by a member of any other.
                A typical guarantor pool of a few thousand members becomes the whole network —
                and insufficient guarantors, one of the sector&rsquo;s most common reasons for loan
                rejection, stops being the reason.
              </p>
              <div className="mt-5 max-w-xl rounded-card border border-mint/20 bg-mint/[0.04] p-5">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mint">Worked example</div>
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  A member applying for a loan at a 400-member SACCO can be guaranteed by a
                  cousin who belongs to a different SACCO on the network entirely — guarantee
                  capacity is still checked across every SACCO that member guarantees in, so
                  exposure never silently stacks past what they can actually cover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credit score */}
      <section className="border-b border-rule py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-violet/10">
              <IconScore className="h-6 w-6 text-violet" />
            </div>
            <div>
              <h2 className="font-serif text-[1.6rem] text-ink">A cooperative credit score</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
                Credit bureaus record defaults. They have no record of a member contributing
                KES 5,000 a month across two SACCOs for six years without missing once.
                SaccoSphere is the only place that positive signal accumulates at all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unified portfolio */}
      <section className="border-b border-rule bg-surface py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-mint/10">
              <IconPortfolio className="h-6 w-6 text-mint" />
            </div>
            <div>
              <h2 className="font-serif text-[1.6rem] text-ink">A member&rsquo;s whole cooperative life, in one place</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
                Total savings, every loan, every dividend, across every SACCO a member belongs
                to — on one phone. Not a feature competitors forgot to build. A category that
                didn&rsquo;t exist before a network did.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Can't follow */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>The structural ceiling</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            What a single-SACCO system cannot do, no matter how good it is
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            This isn&rsquo;t a features gap a competitor closes with a sprint. It&rsquo;s an architectural
            ceiling — these six things require more than one institution on the same platform at
            the same time.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CANT_FOLLOW.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-rule bg-white p-4 text-[13.5px] text-ink-soft">
                <span className="text-red-500">&times;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Flywheel */}
      <section className="border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <SectionLabel>The data flywheel</SectionLabel>
              <h2 className="max-w-md font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
                The network gets stronger with every SACCO that joins it
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-soft">
                Every new SACCO adds signal, lowers the shared cost of the infrastructure
                underneath it, and makes the next underwriting decision — on any SACCO, not just
                the new one — a little better informed.
              </p>
            </div>
            <DataFlywheel />
          </div>
        </div>
      </section>

      <CTABand
        title={<>Whichever side you&rsquo;re on, <em className="italic text-violet-light">the network works for you</em></>}
        body="See what changes for your SACCO, or find out if yours is already on the network."
        buttons={[
          { label: 'For SACCOs', href: '/for-saccos' },
          { label: 'For members', href: '/for-members', variant: 'secondary' },
        ]}
      />
    </main>
  )
}
