import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { InPageNav } from '@/components/InPageNav'
import { FeatureSection } from '@/components/FeatureSection'
import { CTABand } from '@/components/CTABand'
import { SectionLabel } from '@/components/SectionLabel'
import {
  IconPortfolio,
  IconScore,
  IconPhoneCall,
  IconFourEyes,
  IconDoorExit,
  IconBuilding,
  IconLedger,
  IconArchive,
  IconShield,
  IconChainHash,
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'Platform',
  description: 'What actually runs underneath the member app, the SACCO admin portal, and the network.',
}

const NAV_ITEMS = [
  { id: 'member-experience', label: 'Member experience' },
  { id: 'credit-engine', label: 'Credit & lending' },
  { id: 'collections', label: 'Collections & risk' },
  { id: 'operations', label: 'Admin operations' },
  { id: 'lifecycle', label: 'Member lifecycle' },
  { id: 'checkoff', label: 'Employer check-off' },
  { id: 'architecture', label: 'Architecture' },
]

const ARCHITECTURE_BADGES = [
  { icon: IconLedger, title: 'Immutable ledger', body: 'One audited entrypoint for every balance change — nothing is ever edited directly.' },
  { icon: IconFourEyes, title: 'Multi-tenant isolation', body: 'Every query filters by SACCO. No shared state, no cross-tenant reads.' },
  { icon: IconArchive, title: 'Async execution', body: 'Payments, notifications, and reports run on isolated queues with idempotent retries.' },
  { icon: IconShield, title: 'Integrations', body: 'M-Pesa Daraja, Metropol CRB, Africa’s Talking SMS, Firebase push — built in, not bolted on.' },
  { icon: IconChainHash, title: 'Audit chain', body: 'Every sensitive change is hashed to the one before it.' },
]

export default function PlatformPage() {
  return (
    <main>
      <PageHero
        eyebrow="The platform"
        title="One ledger. Three applications. Nothing to reconcile."
        subtitle="A member on a phone, a credit officer in a browser, and a platform administrator watching the whole network all read from the same source of truth. Here's what's actually running underneath that promise."
      />

      <InPageNav items={NAV_ITEMS} />

      <FeatureSection
        id="member-experience"
        icon={IconPortfolio}
        eyebrow="For the member"
        title="A member's whole cooperative life, in one app"
        intro="Every SACCO a member belongs to, in one portfolio — not a login per institution."
        features={[
          'Unified savings, loan and dividend view across every SACCO',
          'M-Pesa STK Push deposits with instant ledger posting',
          'Internal transfers between BOSA, FOSA, loan repayment and share capital',
          'Paybill deposits without opening the app, for feature-phone reach',
          'Biometric / PIN login, downloadable PDF statements',
          'Digital guarantor requests, consent, and reconsent on restructures',
        ]}
      />

      <FeatureSection
        id="credit-engine"
        icon={IconScore}
        eyebrow="For underwriting"
        title="Lending decisions explained, not just issued"
        intro="A what-if calculator before a member ever applies, a plain-language appraisal summary after, and a cost-of-credit disclosure before disbursement — not a black-box approval."
        tone="surface"
        features={[
          'Live Metropol CRB scoring with cached-vs-fresh checks',
          'What-if eligibility calculator, no application created',
          'Effective-annual-rate cost-of-credit disclosure before disbursement',
          'Guarantor capacity enforced across every SACCO a member guarantees in',
          'Restructure, reschedule, top-up, buy-off and penalty-waiver workflows',
          'SASRA 5-band classification & provisioning, computed, not spreadsheet-tracked',
        ]}
      />

      <FeatureSection
        id="collections"
        icon={IconPhoneCall}
        eyebrow="For the back office"
        title="A real collections desk, not an arrears report"
        intro="Overdue loans sorted worst-first, a contact log that can't be edited after the fact, and portfolio-at-risk reporting that updates as the queue is worked, not at month-end."
        features={[
          'Worst-first overdue queue with per-member contact history',
          'Promise-to-pay tracking, resolved automatically by a nightly sweep',
          'Portfolio-at-risk reporting by days-past-due band',
          'Guarantor recovery, always routed through maker-checker approval',
          'Configurable reminder cadence, quiet hours, and daily caps per SACCO',
          'A holiday-mode switch that tightens withdrawal limits sector-wide',
        ]}
      />

      <FeatureSection
        id="operations"
        icon={IconFourEyes}
        eyebrow="For SACCO admins"
        title="Governance enforced by the system, not the policy folder"
        intro="The officer who approves a loan cannot be the one who disburses it — not because the handbook says so, but because the software won't let them."
        tone="surface"
        features={[
          'Step-up MFA and maker-checker on every money-moving action',
          'Membership application and KYC review queue',
          'Dividend declaration with four-eyes approval control',
          'Bulk SMS, member import, and a full approvals audit trail',
          'Auto-generated SASRA Forms 1, 2 and 3',
          'Role-based access, down to a dedicated collections-officer role',
        ]}
      />

      <FeatureSection
        id="lifecycle"
        icon={IconDoorExit}
        eyebrow="For the whole membership"
        title="The parts of membership nobody builds for"
        intro="A member leaving, naming a nominee, or passing away isn't an edge case in a SACCO's real operations — it has its own notice period, settlement logic, and document-verified claims process here."
        features={[
          'Exit notice periods with automatic loan-offset against deposits',
          'Share-capital transfer to another member on exit',
          'A standing nominee registry with guardian fields for minors',
          'Deceased-member claims: document checklist, verification, settlement',
          'Every balance change on exit still posts through the same ledger',
        ]}
      />

      <FeatureSection
        id="checkoff"
        icon={IconBuilding}
        eyebrow="For employer partners"
        title="Payroll check-off, handled end to end"
        intro="Deposits, shares and loan instalments deducted at source by an employer, matched against what was actually remitted — with a real variance queue for what doesn't match."
        tone="surface"
        features={[
          'Employer and payroll-mandate management per member',
          'Monthly deduction schedule generation, locking, and export',
          'Remittance file import with automatic line-level matching',
          'A variance queue for under/over-deductions and payroll mismatches',
          'Remittance-timeliness and arrears-ageing dashboards per employer',
        ]}
      />

      <section id="architecture" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Underneath all of it</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Infrastructure, briefly
          </h2>
          <div
            className="mt-10 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
          >
            {ARCHITECTURE_BADGES.map((b) => (
              <div key={b.title} className="rounded-card border border-rule bg-surface p-6">
                <b.icon className="mb-4 h-6 w-6 text-navy-2" />
                <div className="mb-2 text-[13.5px] font-semibold text-ink">{b.title}</div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={<>See it running against <em className="italic text-violet-light">your own SACCO&rsquo;s data</em></>}
        body="A demo isn't a slide deck here — we'll walk through your member count, loan book and current pain points on the call."
        buttons={[
          { label: 'Request a demo', href: '/for-saccos#demo' },
          { label: 'Read the security page', href: '/security', variant: 'secondary' },
        ]}
      />
    </main>
  )
}
