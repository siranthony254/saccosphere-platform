import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { InPageNav } from '@/components/InPageNav'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import { IconCheck } from '@/components/icons'
import { PRICING_TIERS, PRICING_ADDONS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple monthly pricing for SACCOs, based on member count. The member app is free. Pilot SACCOs pay no subscription for 90 days.',
}

const NAV_ITEMS = [
  { id: 'subscription', label: 'Subscription' },
  { id: 'setup', label: 'Setup & usage' },
  { id: 'payments', label: 'Payment fees' },
  { id: 'modules', label: 'Planned modules' },
  { id: 'contract', label: 'Contract terms' },
  { id: 'faq', label: 'Questions' },
]

const INCLUDED = [
  'Member app and admin portal',
  'KYC review',
  'Loans and guarantors',
  'Contributions and ledger',
  'Statements',
  'Dividends workflow',
  'SASRA return drafts',
  'Bulk SMS tools (billed by use)',
  'Audit trail, roles & permissions',
  'Standard support',
]

const SETUP_FEES = [
  { tier: 'Micro', fee: 'KES 20,000', covers: 'Moving your member data from spreadsheets, admin setup' },
  { tier: 'Growth', fee: 'KES 50,000', covers: 'Cleaning up data from your current system, staff training sessions' },
  { tier: 'Enterprise', fee: 'KES 150,000', covers: 'Multi-branch setup, deeper integration with your current systems' },
]

const USAGE_COSTS = [
  { service: 'Bulk SMS', price: 'KES 1.00 per SMS', note: 'Reminders, alerts, statements and campaigns' },
  { service: 'Credit bureau check', price: 'KES 150 per check', note: 'Available once our bureau integration goes live — you pay only when a check is run' },
]

const WORKED_EXAMPLES = [
  { sacco: 'Micro, 400 members', usage: '2,000 SMS, 10 credit checks', bill: 'KES 18,500', perMember: 'About KES 46' },
  { sacco: 'Growth, 2,500 members', usage: '15,000 SMS, 150 credit checks', bill: 'KES 82,500', perMember: 'KES 33' },
  { sacco: 'Enterprise, 12,000 members', usage: '80,000 SMS, 800 credit checks', bill: 'KES 320,000', perMember: 'About KES 27' },
]

const CONTRACT_TERMS = [
  'The first term is 12 months and renews each year. Either side can end it with 60 days’ notice before the term ends.',
  'The subscription is billed monthly in advance. Usage is billed monthly in arrears. Invoices are due within 7 days.',
  'We give 60 days’ written notice of any price change, and review prices once a year.',
  'Your data stays yours. If you leave, we return it within 14 days.',
  'Full terms are in the Master Service Agreement, which we send before you commit.',
]

const PRICING_FAQ = [
  {
    q: 'Do members pay anything?',
    a: 'No. The app is free for members.',
  },
  {
    q: 'Are there other fees?',
    a: 'No fees beyond those on this page. Safaricom charges its own tariffs on your paybill and payouts, paid directly to Safaricom.',
  },
  {
    q: 'Why is pricing based on member count?',
    a: 'Our cost to run the platform for you grows with your members, and a flat tier is easier for a board to budget than a per-transaction charge.',
  },
  {
    q: 'Can we cancel during the pilot?',
    a: 'Yes, at any time, at no charge.',
  },
  {
    q: 'Do you discount for unions or groups of SACCOs?',
    a: 'We’re open to it for apex bodies, unions and groups onboarding several SACCOs together — ask us.',
  },
] as const

export default function PricingPage() {
  return (
    <main>
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing, set by your member count"
        subtitle="One monthly subscription based on how many members your SACCO has. The member app is always free for members. These are launch prices for our first cohort — pilot SACCOs pay no subscription for their first 90 days."
      />

      <InPageNav items={NAV_ITEMS} />

      <section id="subscription" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Monthly subscription</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Three tiers, one price list
          </h2>

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
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-card border border-rule bg-surface p-7">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft/70">
              Every tier includes
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {INCLUDED.map((f) => (
                <div key={f} className="flex gap-2 text-[12.5px] text-ink-soft">
                  <IconCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mint" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="setup" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>One-time setup &amp; usage</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            What onboarding costs, and what you pay for as you go
          </h2>

          <div className="mt-10 overflow-x-auto rounded-card border border-rule bg-white">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-rule bg-surface text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3">Setup fee</th>
                  <th className="px-5 py-3">What it covers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {SETUP_FEES.map((s) => (
                  <tr key={s.tier}>
                    <td className="px-5 py-3.5 font-medium text-ink">{s.tier}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.fee}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.covers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[12.5px] text-ink-soft">
            Billed monthly in arrears — you pay for what you use.
          </p>

          <div className="mt-6 overflow-x-auto rounded-card border border-rule bg-white">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-rule bg-surface text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {USAGE_COSTS.map((u) => (
                  <tr key={u.service}>
                    <td className="px-5 py-3.5 font-medium text-ink">{u.service}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{u.price}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{u.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft/70">
              What it costs in practice
            </div>
            <div className="overflow-x-auto rounded-card border border-rule bg-white">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-rule bg-surface text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                    <th className="px-5 py-3">SACCO</th>
                    <th className="px-5 py-3">Usage assumed</th>
                    <th className="px-5 py-3">Monthly bill</th>
                    <th className="px-5 py-3">Per member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {WORKED_EXAMPLES.map((e) => (
                    <tr key={e.sacco}>
                      <td className="px-5 py-3.5 font-medium text-ink">{e.sacco}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{e.usage}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{e.bill}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{e.perMember}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-2xl text-[12.5px] leading-relaxed text-ink-soft">
              These are illustrations, not quotes. They leave out the one-time setup fee and
              Safaricom&rsquo;s own M-Pesa charges. Before a demo, add up what you spend today on
              software licences, SMS gateways, reconciliation time and report preparation, and
              compare.
            </p>
          </div>
        </div>
      </section>

      <section id="payments" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Payment fees</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            No fee on member payments at launch
          </h2>
          <div className="mt-8 max-w-2xl rounded-card border border-mint/30 bg-mint/[0.04] p-7">
            <p className="text-[13.5px] leading-relaxed text-ink-soft">
              We do not charge a fee on your members&rsquo; M-Pesa payments at launch. Safaricom&rsquo;s
              own charges on your paybill and payouts still apply, and you pay those directly to
              Safaricom.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
              We plan to introduce a small platform fee on payments later. We&rsquo;ll do that only
              after we hold the authorisation the Central Bank of Kenya requires for it, and only
              after giving every SACCO 60 days&rsquo; written notice.
            </p>
          </div>
        </div>
      </section>

      <section id="modules" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Optional modules</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Planned, not available yet
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            These aren&rsquo;t available yet — shown so you can see where we&rsquo;re heading. Pilot
            SACCOs get early access and a say in what we build first. Prices may change before
            release, and you&rsquo;re never charged for a module before it&rsquo;s available and you&rsquo;ve
            switched it on.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PRICING_ADDONS.map((a) => (
              <div key={a.name} className="rounded-card border border-dashed border-rule bg-white p-6">
                <div className="text-[13.5px] font-semibold text-ink">{a.name}</div>
                <div className="mt-2 text-[12.5px] text-ink-soft">{a.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contract" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Contract terms, in plain language</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            No surprises in the fine print
          </h2>
          <ul className="mt-8 max-w-2xl space-y-3 border-t border-rule pt-6">
            {CONTRACT_TERMS.map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-soft">
                <IconCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mint" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-[12.5px] text-ink-soft">Prices are in Kenya shillings.</p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Pricing questions</SectionLabel>
          <div className="mt-8 divide-y divide-rule">
            {PRICING_FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <div className="mb-2 text-[14.5px] font-semibold text-ink">{item.q}</div>
                <p className="text-[13.5px] leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={<>See it with <em className="italic text-violet-light">your own</em> loan products</>}
        body="Book a 45-minute walkthrough. We reply within two working days."
        buttons={[{ label: 'Book a demo', href: '/for-saccos#demo' }, { label: 'Start a pilot', href: 'mailto:anthony@saccosphere.co.ke?subject=Pilot%20programme', variant: 'secondary' }]}
      />
    </main>
  )
}
