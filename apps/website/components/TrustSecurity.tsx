import { SectionLabel } from './SectionLabel'
import { IconLedger, IconFourEyes, IconChainHash, IconArchive, IconShield } from './icons'

const BADGES = [
  {
    icon: IconLedger,
    title: 'Immutable double-entry ledger',
    body: 'No balance column anywhere can be edited directly. Every movement posts through one audited entrypoint — balances are always calculated, never stored.',
  },
  {
    icon: IconFourEyes,
    title: 'Maker-checker on every money action',
    body: 'The officer who approves a loan cannot be the officer who disburses it. The admin who declares dividends cannot approve them. Four eyes, enforced in the model, not the manual.',
  },
  {
    icon: IconChainHash,
    title: 'Cryptographic audit chain',
    body: 'Every sensitive change is hashed to the entry before it. Tamper with one row outside the application and the chain breaks on the next verification.',
  },
  {
    icon: IconArchive,
    title: 'Write-once audit archiving',
    body: 'Daily exports to object-locked storage for legal non-repudiation — built toward the multi-year transaction retention regulators expect.',
  },
  {
    icon: IconShield,
    title: 'Data protection by design',
    body: 'Consent, retention and erasure workflows built around Kenya’s Data Protection Act from day one, not bolted on after a request arrives.',
  },
]

export function TrustSecurity() {
  return (
    <section id="security" className="border-b border-rule py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>Trust &amp; security</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          Built for regulators, <em className="italic">not retrofitted for them</em>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Every member&rsquo;s money moves directly between their own M-Pesa and their SACCO&rsquo;s own
          paybill — SaccoSphere never holds it. What we hold is the record, and we hold it the
          way a regulator would insist on.
        </p>

        <div
          className="mt-12 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {BADGES.map((b) => (
            <div key={b.title} className="rounded-card border border-rule bg-surface p-6">
              <b.icon className="mb-4 h-6 w-6 text-navy-2" />
              <div className="mb-2 text-[13.5px] font-semibold leading-snug text-ink">{b.title}</div>
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
