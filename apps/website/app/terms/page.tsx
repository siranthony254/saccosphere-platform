import type { Metadata } from 'next'
import { LegalLayout, LegalSection } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Draft template — pending legal review.',
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of service">
      <LegalSection title="1. What SaccoSphere is">
        <p>
          SaccoSphere Ltd provides software and infrastructure to SACCOs and their members.
          SaccoSphere is not a SACCO, a bank, or a deposit-taking institution, and does not hold
          member funds at any point — see our{' '}
          <a href="/security" className="text-violet underline">
            Security &amp; compliance
          </a>{' '}
          page for the full regulatory position.
        </p>
      </LegalSection>
      <LegalSection title="2. Who these terms apply to">
        <p>
          Anyone using the member app, a SACCO admin portal, or this website. A SACCO&rsquo;s own
          by-laws and membership agreement continue to govern your relationship with that SACCO
          itself.
        </p>
      </LegalSection>
      <LegalSection title="3. Your account">
        <p>
          You&rsquo;re responsible for the accuracy of information you submit and for keeping your
          login credentials secure. Report a suspected compromise immediately.
        </p>
      </LegalSection>
      <LegalSection title="4. Money movement">
        <p>
          Deposits and disbursements move directly between your own payment method and your
          SACCO&rsquo;s own payment credentials. SaccoSphere records the transaction; SaccoSphere does
          not custody the funds in transit.
        </p>
      </LegalSection>
      <LegalSection title="5. Availability">
        <p>
          We aim for continuous availability but do not guarantee it. Scheduled maintenance will
          be communicated through your SACCO where practical.
        </p>
      </LegalSection>
      <LegalSection title="6. Limitation of liability">
        <p>
          SaccoSphere is not liable for a SACCO&rsquo;s own lending, governance, or regulatory
          decisions made using the platform&rsquo;s tools.
        </p>
      </LegalSection>
      <LegalSection title="7. Changes to these terms">
        <p>Material changes will be communicated in advance of taking effect.</p>
      </LegalSection>
      <LegalSection title="8. Contact">
        <p>anthony@saccosphere.co.ke</p>
      </LegalSection>
    </LegalLayout>
  )
}
