import type { Metadata } from 'next'
import { LegalLayout, LegalSection } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Delete your account',
  description: 'How to request deletion of your SaccoSphere member account and data, and what must be retained by law.',
}

export default function DeleteAccountPage() {
  return (
    <LegalLayout title="Delete your account">
      <LegalSection title="1. How to request deletion">
        <p>
          Email <a className="text-violet underline" href="mailto:anthony@saccosphere.co.ke?subject=Delete%20my%20account">anthony@saccosphere.co.ke</a> from
          the address or phone number linked to your account, or ask your SACCO directly — your
          SACCO is the data controller for your membership and can action the request on your
          behalf. Tell us your full name, SACCO name/membership number, and the phone number or
          email tied to your account so we can verify it&rsquo;s you.
        </p>
      </LegalSection>
      <LegalSection title="2. What gets deleted">
        <p>
          Your login credentials, profile details (outside what&rsquo;s legally required to retain,
          below), device tokens, and app-level activity not tied to a financial record. We
          acknowledge every request within 2 business days and confirm once it&rsquo;s complete.
        </p>
      </LegalSection>
      <LegalSection title="3. What must be retained">
        <p>
          Kenyan law requires SACCOs to keep financial and membership records for a minimum
          period (contribution, loan, guarantor and transaction history, and KYC documents used
          for identity verification) even after an account is closed — this is the SACCO&rsquo;s
          regulatory obligation, not ours. That data stays with your SACCO&rsquo;s own records for its
          required retention period, then follows the same erasure workflow described on our{' '}
          <a className="text-violet underline" href="/data-protection">
            data protection
          </a>{' '}
          page.
        </p>
      </LegalSection>
      <LegalSection title="4. If you have an open loan or savings balance">
        <p>
          Deleting your account does not close out an open loan, savings balance or dividend
          entitlement — settle those with your SACCO first. We&rsquo;ll tell you if your request
          can&rsquo;t proceed for this reason, and point you to your SACCO to resolve it.
        </p>
      </LegalSection>
      <LegalSection title="5. Deleting the app without deleting your account">
        <p>
          Uninstalling the app from your phone does not delete your account or data — it only
          removes the app itself. Follow the steps above to actually delete your account.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
