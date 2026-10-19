import Link from 'next/link'
import { Hero } from '@/components/Hero'
import { CTABand } from '@/components/CTABand'
import { SectionLabel } from '@/components/SectionLabel'
import { IconPortfolio, IconBuilding, IconScale, IconArrowRight } from '@/components/icons'

const DOORS = [
  {
    icon: IconBuilding,
    title: 'Run a SACCO',
    body: 'Membership, loans, savings, dividends and SASRA returns — off a desktop, into a modern back office.',
    href: '/for-saccos',
    cta: 'For SACCOs',
  },
  {
    icon: IconPortfolio,
    title: 'Belong to one',
    body: 'One account for every SACCO you’re a member of. Deposit, borrow, and read a statement from your phone.',
    href: '/for-members',
    cta: 'For members',
  },
  {
    icon: IconScale,
    title: 'Evaluate the company',
    body: 'Regulatory position, security architecture, and how the network economics actually work.',
    href: '/security',
    cta: 'Security & compliance',
  },
]

export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* Three doors */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Start here</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
            Three ways to use this site
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {DOORS.map((d) => (
              <Link
                key={d.title}
                href={d.href}
                className="group rounded-card border border-rule bg-white p-7 transition-colors hover:border-violet/40"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-violet/10">
                  <d.icon className="h-5 w-5 text-violet" />
                </div>
                <div className="mb-2 text-[16px] font-semibold text-ink">{d.title}</div>
                <p className="mb-5 text-[13px] leading-relaxed text-ink-soft">{d.body}</p>
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-violet">
                  {d.cta}
                  <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why this exists — teaser into /network */}
      <section className="border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-10 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <div>
              <SectionLabel>Why one network, not 300 separate systems</SectionLabel>
              <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
                A SACCO on its own can&rsquo;t see the <em className="italic">member</em> &mdash; only its own account of them
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
                Every legacy SACCO system is built to solve problems inside one institution. A
                member mid-default at one SACCO can walk into another the same week and pass
                underwriting clean. SaccoSphere closes that gap because it runs underneath more
                than one SACCO at once — something no single-institution system can ever do,
                regardless of how good its software is.
              </p>
              <Link
                href="/network"
                className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-violet"
              >
                See how the network works
                <IconArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-card border border-rule bg-white p-7">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft/60">
                In one network
              </div>
              <ul className="space-y-3 text-[13.5px] text-ink-soft">
                <li className="flex gap-2.5"><span className="text-mint">&bull;</span> Cross-SACCO debt visibility before approval</li>
                <li className="flex gap-2.5"><span className="text-mint">&bull;</span> A shared guarantor pool across every member SACCO</li>
                <li className="flex gap-2.5"><span className="text-mint">&bull;</span> A cooperative credit score no bureau can build alone</li>
                <li className="flex gap-2.5"><span className="text-mint">&bull;</span> One portfolio view across a member&rsquo;s whole cooperative life</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Proof / press placeholder */}
      <section className="border-b border-rule py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft/50">
            SACCOs and partners on the network
          </div>
          <div className="rounded-card border border-dashed border-rule bg-surface px-6 py-10 text-center text-[13px] text-ink-soft/60">
            Partner and press logos will appear here as the network grows.
          </div>
        </div>
      </section>

      <CTABand
        id="demo"
        title={<>Bring your SACCO, or find yours, <em className="italic text-violet-light">on the network</em></>}
        body="Whichever side you're on, the next step takes one conversation."
        buttons={[
          { label: 'For SACCOs', href: '/for-saccos' },
          { label: 'For members', href: '/for-members', variant: 'secondary' },
        ]}
      />
    </main>
  )
}
