import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import { SaccoDirectory } from '@/components/SaccoDirectory'
import {
  IconPortfolio,
  IconSend,
  IconUsers,
  IconFile,
  IconBell,
} from '@/components/icons'
import { MEMBER_FAQ } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'For Members',
  description: 'One account for every SACCO you belong to. Find your SACCO on the network.',
}

const CAPABILITIES = [
  { icon: IconPortfolio, title: 'One portfolio, every SACCO', body: 'Savings, loans and dividends across every cooperative you belong to, in one screen.' },
  { icon: IconSend, title: 'Deposit from your phone', body: 'M-Pesa STK Push, or dial your SACCO’s paybill directly — no app required for that part.' },
  { icon: IconUsers, title: 'Apply, guarantee, consent', body: 'Apply for a loan, add a guarantor, or respond to someone else’s guarantor request — digitally, with OTP consent.' },
  { icon: IconFile, title: 'A statement whenever you need one', body: 'Downloadable PDF statements, no trip to the branch.' },
  { icon: IconBell, title: 'Know before you’re surprised', body: 'Notifications for loan decisions, guarantor requests, and anything that needs your response.' },
]

export default function ForMembersPage() {
  return (
    <main>
      <PageHero
        eyebrow="For members"
        title="One account for every SACCO you belong to"
        subtitle="Download the app, or search the network below to see if your SACCO is already on it."
      />

      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>What you can do</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.4rem]">
            Everything you used to need a branch visit for
          </h2>
          <div
            className="mt-10 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-card border border-rule bg-white p-6">
                <c.icon className="mb-4 h-6 w-6 text-violet" />
                <div className="mb-2 text-[13.5px] font-semibold text-ink">{c.title}</div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#"
              className="rounded-lg bg-navy px-6 py-3.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Download for iOS
            </a>
            <a
              href="#"
              className="rounded-lg border border-rule bg-white px-6 py-3.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface"
            >
              Download for Android
            </a>
          </div>
        </div>
      </section>

      <SaccoDirectory />

      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Questions members ask first</SectionLabel>
          <div className="mt-8 divide-y divide-rule">
            {MEMBER_FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <div className="mb-2 text-[14.5px] font-semibold text-ink">{item.q}</div>
                <p className="text-[13.5px] leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={<>Your SACCO life, <em className="italic text-violet-light">in one place</em></>}
        body="Search the network above, or download the app once you know your SACCO is on it."
        buttons={[
          { label: 'Search the network', href: '#directory' },
          { label: 'For SACCOs', href: '/for-saccos', variant: 'secondary' },
        ]}
      />
    </main>
  )
}
