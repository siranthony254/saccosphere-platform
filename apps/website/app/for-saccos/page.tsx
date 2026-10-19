import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import { IconDesktop, IconPaperStack, IconSplit, IconCheck } from '@/components/icons'
import { PRICING_TIERS, PRICING_ADDONS, ONBOARDING_STEPS, SACCO_FAQ } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'For SACCOs',
  description: 'What changes for your SACCO, how onboarding works, and what it costs.',
}

const OUTCOMES = [
  { icon: IconDesktop, title: 'Close the books same-day', body: 'Numbers the board can see the morning after month-end, not two weeks later.' },
  { icon: IconPaperStack, title: 'Cut loan-committee time', body: 'CRB score, guarantor status and cross-SACCO exposure, on the screen before the meeting starts.' },
  { icon: IconSplit, title: 'Stop losing to hidden debt', body: 'See a member’s exposure at every other SACCO on the network before you approve, not after.' },
]

export default function ForSaccosPage() {
  return (
    <main>
      <PageHero
        eyebrow="For SACCOs"
        title="Everything your SACCO runs on a desktop today, running properly instead"
        subtitle="Membership, loans, savings, dividends and SASRA returns — on one platform, with a ledger that closes itself."
      />

      {/* Outcomes */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>What changes</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
            Three things every board notices in month one
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {OUTCOMES.map((o) => (
              <div key={o.title} className="rounded-card border border-rule bg-white p-7">
                <o.icon className="mb-5 h-7 w-7 text-violet" />
                <div className="mb-2 text-[15px] font-semibold text-ink">{o.title}</div>
                <p className="text-[13px] leading-relaxed text-ink-soft">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section className="border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Getting started</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
            Onboarding, not a migration project
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {ONBOARDING_STEPS.map((s) => (
              <div key={s.step} className="rounded-card border border-rule bg-white p-6">
                <div className="mb-3 font-serif text-2xl text-violet/40">{s.step}</div>
                <div className="mb-2 text-[14px] font-semibold text-ink">{s.title}</div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
            Priced by member count, not by negotiation
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            A platform subscription plus a small percentage on money that actually moves through
            it — no setup fee, no seat licensing per admin user.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-card border p-7 ${
                  tier.featured ? 'border-violet bg-violet/[0.04] shadow-sm' : 'border-rule bg-white'
                }`}
              >
                {tier.featured && (
                  <div className="mb-3 inline-block rounded-full bg-violet px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Most common
                  </div>
                )}
                <div className="text-[15px] font-semibold text-ink">{tier.name}</div>
                <div className="text-[12px] text-ink-soft">{tier.range}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-[1.8rem] text-ink">{tier.price}</span>
                  <span className="text-[12.5px] text-ink-soft">{tier.period}</span>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">{tier.description}</p>
                <ul className="mt-5 space-y-2.5 border-t border-rule pt-5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[12.5px] text-ink-soft">
                      <IconCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mint" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-card border border-rule bg-surface p-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft/70">
              Vertical add-ons, any tier
            </div>
            <div className="flex flex-wrap gap-4">
              {PRICING_ADDONS.map((a) => (
                <div key={a.name} className="text-[12.5px] text-ink-soft">
                  <span className="font-medium text-ink">{a.name}</span> — {a.price}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case study placeholder */}
      <section className="border-b border-rule bg-surface py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="rounded-card border border-dashed border-rule bg-white px-6 py-10 text-center">
            <p className="text-[13px] text-ink-soft">
              The first SACCO case study — member count, time-to-close, loan-book growth — goes
              here once we have one to tell properly.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Questions boards ask first</SectionLabel>
          <div className="mt-8 divide-y divide-rule">
            {SACCO_FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <div className="mb-2 text-[14.5px] font-semibold text-ink">{item.q}</div>
                <p className="text-[13.5px] leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        id="demo"
        title={<>Talk to us about <em className="italic text-violet-light">your SACCO</em></>}
        body="Bring your member count and current pain points — we'll tell you honestly whether you're a fit before we show you anything."
        buttons={[{ label: 'Request a demo', href: 'mailto:anthony@saccosphere.co.ke' }]}
      />
    </main>
  )
}
