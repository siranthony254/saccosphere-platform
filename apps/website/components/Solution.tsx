import { SectionLabel } from './SectionLabel'
import { IconPortfolio, IconLedger, IconFourEyes } from './icons'

const APPS = [
  {
    icon: IconPortfolio,
    tag: 'For members',
    title: 'One account for every SACCO you belong to',
    body: 'Savings, loans, dividends and repayment schedules across every cooperative you’re part of, in a single app. Deposit by M-Pesa, apply for a loan, add a guarantor and read your statement — without visiting a branch.',
  },
  {
    icon: IconLedger,
    tag: 'For SACCO admins',
    title: 'Run your SACCO without the paperwork',
    body: 'Membership applications, loan underwriting, dividend declarations and SASRA returns, generated from the same data instead of recompiled from it. Approvals that used to take a committee meeting take an afternoon.',
  },
  {
    icon: IconFourEyes,
    tag: 'For the network',
    title: 'Infrastructure that gets safer as it grows',
    body: 'Every SACCO on the platform shares the cost of the security, compliance and payment infrastructure underneath it — and the credit and fraud signal above it. The network gets stronger with every member who joins, not weaker.',
  },
]

export function Solution() {
  return (
    <section id="platform" className="border-b border-rule py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>The platform</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          Three applications. <em className="italic">One source of truth.</em>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          A member on a phone, a credit officer on a browser, and a platform administrator
          watching the whole network all read from the same ledger — there is nothing to
          reconcile between them, because there is nothing that could disagree.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {APPS.map((a) => (
            <div key={a.title} className="rounded-card border border-rule bg-white p-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-violet/10">
                <a.icon className="h-5 w-5 text-violet" />
              </div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft/70">
                {a.tag}
              </div>
              <div className="mb-3 text-[16px] font-semibold leading-snug text-ink">{a.title}</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
