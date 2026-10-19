import type { Metadata } from 'next'
import { LegalLayout, LegalSection } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Data Protection',
  description: 'How SaccoSphere approaches data protection under Kenya’s Data Protection Act. Draft template — pending legal review.',
}

export default function DataProtectionPage() {
  return (
    <LegalLayout title="Data protection notice">
      <LegalSection title="1. Our approach">
        <p>
          SaccoSphere is built around the Data Protection Act 2019 from the architecture up, not
          as a policy layered on afterward: per-tenant data isolation, consent tracking, and
          managed retention and erasure workflows run underneath every SACCO on the platform.
        </p>
      </LegalSection>
      <LegalSection title="2. Lawful basis">
        <p>
          Personal data is processed under a SACCO&rsquo;s own lawful basis for serving its members
          (contractual necessity and legal/regulatory obligation), with explicit consent sought
          for anything beyond that — for example, cross-SACCO guarantor or credit-signal features
          a member opts into.
        </p>
      </LegalSection>
      <LegalSection title="3. Retention">
        <p>
          Retention periods follow each SACCO&rsquo;s regulatory obligations (including CBK/SASRA
          transaction-record expectations). Retention rules are configured per data category, not
          as a single blanket period.
        </p>
      </LegalSection>
      <LegalSection title="4. Erasure requests">
        <p>
          A documented erasure workflow logs every request, applies it within the active
          retention window, and records the outcome for audit — erasure is never a silent,
          untracked database delete.
        </p>
      </LegalSection>
      <LegalSection title="5. Cross-border transfer">
        <p>
          Infrastructure is hosted with providers capable of meeting the Data Protection Act&rsquo;s
          cross-border transfer requirements; specifics are available on request.
        </p>
      </LegalSection>
      <LegalSection title="6. Registering as a data controller/processor">
        <p>ODPC registration is in progress — see the licences table on our Security &amp; compliance page for current status.</p>
      </LegalSection>
      <LegalSection title="7. Exercising your rights">
        <p>Contact anthony@saccosphere.co.ke, or your SACCO directly as the data controller for your membership.</p>
      </LegalSection>
    </LegalLayout>
  )
}
