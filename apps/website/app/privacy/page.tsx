import type { Metadata } from 'next'
import { LegalLayout, LegalSection } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Draft template — pending legal review.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy">
      <LegalSection title="1. What this covers">
        <p>
          This policy describes how SaccoSphere Ltd (&ldquo;SaccoSphere&rdquo;, &ldquo;we&rdquo;) handles
          personal data in connection with this website, the member app, and the SACCO/platform
          administration portals. It does not describe how an individual SACCO handles member
          data as its own data controller — see section 6.
        </p>
      </LegalSection>
      <LegalSection title="2. What we collect">
        <p>
          Account details (name, phone number, email, national ID for KYC), device and app-usage
          data, and transaction metadata necessary to operate savings, loan and dividend records
          on behalf of a SACCO. We do not collect more than a SACCO&rsquo;s own regulatory
          obligations require.
        </p>
      </LegalSection>
      <LegalSection title="3. How we use it">
        <p>
          To operate the platform a SACCO has engaged us to run: processing deposits and
          disbursements, underwriting loans, generating statements and regulatory returns, and
          securing accounts (fraud detection, audit logging).
        </p>
      </LegalSection>
      <LegalSection title="4. Who we share it with">
        <p>
          Your own SACCO (the data controller for your membership), payment processors
          (M-Pesa/Safaricom) strictly to execute a transaction you initiated, and credit bureaus
          (Metropol) only in connection with a loan application you submitted. We do not sell
          personal data.
        </p>
      </LegalSection>
      <LegalSection title="5. Your rights">
        <p>
          Under the Data Protection Act 2019, you may request access to, correction of, or
          erasure of your personal data, subject to a SACCO&rsquo;s own regulatory retention
          obligations. Requests go to the contact below.
        </p>
      </LegalSection>
      <LegalSection title="6. Each SACCO is its own data controller">
        <p>
          SaccoSphere is a data processor acting on each SACCO&rsquo;s instructions. A SACCO&rsquo;s
          member data is never used for the benefit of another SACCO on the network without
          that member&rsquo;s own, separate consent.
        </p>
      </LegalSection>
      <LegalSection title="7. Contact">
        <p>Data protection inquiries: anthony@saccosphere.co.ke</p>
      </LegalSection>
    </LegalLayout>
  )
}
