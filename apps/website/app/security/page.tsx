import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { InPageNav } from '@/components/InPageNav'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import {
  IconLedger,
  IconFourEyes,
  IconChainHash,
  IconArchive,
  IconShield,
  IconScale,
  IconMail,
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'Security & Compliance',
  description: 'Regulatory position, security architecture, and data protection — stated plainly.',
}

const NAV_ITEMS = [
  { id: 'position', label: 'Regulatory position' },
  { id: 'architecture', label: 'Security architecture' },
  { id: 'data-protection', label: 'Data protection' },
  { id: 'licences', label: 'Licences' },
]

const BADGES = [
  { icon: IconLedger, title: 'Immutable double-entry ledger', body: 'No balance column anywhere can be edited directly. Every movement posts through one audited entrypoint — balances are always calculated, never stored.' },
  { icon: IconFourEyes, title: 'Maker-checker on every money action', body: 'The officer who approves a loan cannot be the officer who disburses it. The admin who declares dividends cannot approve them. Four eyes, enforced in the model, not the manual.' },
  { icon: IconChainHash, title: 'Cryptographic audit chain', body: 'Every sensitive change is hashed to the entry before it. Tamper with one row outside the application and the chain breaks on the next verification.' },
  { icon: IconArchive, title: 'Write-once audit archiving', body: 'Daily exports to object-locked storage for legal non-repudiation — built toward the multi-year transaction retention regulators expect.' },
  { icon: IconShield, title: 'Encrypted sensitive data', body: 'Credit-bureau responses and payment credentials are encrypted at rest. PII never persists in plaintext.' },
]

const LICENCES = [
  { name: 'Company incorporation', regulator: 'BRS', why: 'Required to sign contracts and open bank accounts.', status: 'In progress' },
  { name: 'KRA PIN + VAT registration', regulator: 'KRA', why: 'Required to invoice SACCOs and remit taxes.', status: 'In progress' },
  { name: 'ODPC Data Controller registration', regulator: 'ODPC', why: 'Mandatory before handling real member personal data.', status: 'To be filed' },
  { name: 'CBK PSP licence (Electronic Retail)', regulator: 'CBK', why: 'Required before charging transaction-percentage fees.', status: 'Preliminary meeting requested' },
  { name: 'SASRA licence', regulator: 'SASRA', why: 'Not required — SaccoSphere is not a SACCO.', status: 'Not applicable' },
  { name: 'Banking licence', regulator: 'CBK', why: 'Not required — SaccoSphere holds no deposits.', status: 'Not applicable' },
]

export default function SecurityPage() {
  return (
    <main>
      <PageHero
        eyebrow="Security & compliance"
        title="Built for regulators, not retrofitted for them"
        subtitle="Every member's money moves directly between their own M-Pesa and their SACCO's own paybill — SaccoSphere never holds it. What we hold is the record, and we hold it the way a regulator would insist on."
      />

      <InPageNav items={NAV_ITEMS} />

      <section id="position" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Regulatory position</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            A technology platform, not a financial institution
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-card border border-mint/30 bg-mint/[0.04] p-7">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#047857' }}>
                What SaccoSphere is
              </div>
              <div className="mb-3 text-[15px] font-semibold text-ink">A technology and infrastructure provider</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                SaccoSphere provides software, workflow automation, audit trails, reporting
                tools, and payment integration infrastructure. The licensed SACCO remains the
                regulated financial institution and the holder of member funds — the same
                relationship as a SACCO using any core-banking software.
              </p>
            </div>
            <div className="rounded-card border border-gold/30 bg-gold/5 p-7">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#92400E' }}>
                What SaccoSphere is not
              </div>
              <div className="mb-3 text-[15px] font-semibold text-ink">A deposit-taking institution</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                SaccoSphere does not hold member deposits, does not issue loans from its own
                balance sheet, and does not act as a payment intermediary in the regulated
                sense. A transaction-fee model requires a CBK Payment Service Provider licence —
                not a banking licence, SASRA registration, or deposit insurance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Security architecture</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Five controls, none of them optional
          </h2>
          <div
            className="mt-10 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            {BADGES.map((b) => (
              <div key={b.title} className="rounded-card border border-rule bg-white p-6">
                <b.icon className="mb-4 h-6 w-6 text-navy-2" />
                <div className="mb-2 text-[13.5px] font-semibold leading-snug text-ink">{b.title}</div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="data-protection" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Data protection</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Consent, retention and erasure, by design
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            Kenya&rsquo;s Data Protection Act 2019 right-to-erasure requirement is handled through
            managed retention-policy rules and documented erasure workflows — every erasure is
            logged, audited, and reversible within its retention window, not a manual database
            delete. Each SACCO is treated as its own data controller; one SACCO&rsquo;s member data is
            never used for another tenant without that member&rsquo;s own consent.
          </p>
        </div>
      </section>

      <section id="licences" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Licences &amp; registration</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Where we stand, stated plainly
          </h2>
          <div className="mt-10 overflow-x-auto rounded-card border border-rule bg-white">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-rule bg-surface text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  <th className="px-5 py-3">Licence / registration</th>
                  <th className="px-5 py-3">Regulator</th>
                  <th className="px-5 py-3">Why</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {LICENCES.map((l) => (
                  <tr key={l.name}>
                    <td className="px-5 py-3.5 font-medium text-ink">{l.name}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{l.regulator}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{l.why}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-rule py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-card border border-rule bg-white p-7">
            <div className="flex items-start gap-3">
              <IconScale className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet" />
              <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
                Doing diligence on us? Request our full security and compliance overview —
                we&rsquo;ll send it directly, not gate it behind a form.
              </p>
            </div>
            <a
              href="mailto:anthony@saccosphere.co.ke?subject=Security%20overview%20request"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-navy px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <IconMail className="h-4 w-4" />
              Request the overview
            </a>
          </div>
        </div>
      </section>

      <CTABand
        title={<>Questions a diligence team would <em className="italic text-violet-light">actually ask</em></>}
        body="We'd rather answer them directly than have you infer the answer from a marketing page."
        buttons={[{ label: 'Email us', href: 'mailto:anthony@saccosphere.co.ke' }]}
      />
    </main>
  )
}
