import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { SectionLabel } from '@/components/SectionLabel'
import { CTABand } from '@/components/CTABand'
import { IconTarget, IconMail, IconBriefcase } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Company',
  description: 'Mission, leadership, press, careers and how to reach us.',
}

export default function CompanyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Company"
        title="Infrastructure for a sector that was never given any"
        subtitle="SaccoSphere exists because 22,000+ Kenyan cooperatives were asked to run bank-grade financial services on spreadsheets and desktop software built for a single branch."
      />

      {/* Mission */}
      <section className="border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="grid gap-10 sm:grid-cols-[auto_1fr]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-violet/10">
              <IconTarget className="h-6 w-6 text-violet" />
            </div>
            <div>
              <SectionLabel>Mission</SectionLabel>
              <h2 className="max-w-xl font-serif text-[1.9rem] leading-tight text-ink">
                Give every SACCO the infrastructure only the largest one could otherwise afford
              </h2>
              <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
                A SACCO with 400 members and a SACCO with 40,000 members face the same
                regulatory expectations and the same member expectations of a modern bank. Most
                can&rsquo;t build that themselves. SaccoSphere exists so they don&rsquo;t have to — and so
                that a member&rsquo;s cooperative life isn&rsquo;t limited to whichever single institution
                happened to digitise first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Leadership</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            The team
          </h2>
          <div className="mt-10 rounded-card border border-dashed border-rule bg-white px-6 py-10 text-center">
            <p className="text-[13px] text-ink-soft">Leadership bios go here.</p>
          </div>
        </div>
      </section>

      {/* Investors */}
      <section className="border-b border-rule py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Backed by</SectionLabel>
          <div className="mt-6 rounded-card border border-dashed border-rule bg-surface px-6 py-10 text-center">
            <p className="text-[13px] text-ink-soft">Investor and backer logos go here.</p>
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="scroll-mt-28 border-b border-rule bg-surface py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Press</SectionLabel>
          <div className="mt-6 rounded-card border border-dashed border-rule bg-white px-6 py-10 text-center">
            <p className="text-[13px] text-ink-soft">Press mentions go here as they come in.</p>
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="scroll-mt-28 border-b border-rule py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Careers</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Open roles
          </h2>
          <div className="mt-10 flex items-center justify-between gap-4 rounded-card border border-rule bg-white p-6">
            <div className="flex items-center gap-4">
              <IconBriefcase className="h-6 w-6 text-violet" />
              <div>
                <div className="text-[14px] font-semibold text-ink">Backend engineer — payments & ledger</div>
                <div className="text-[12px] text-ink-soft">Remote (Kenya) · Full-time</div>
              </div>
            </div>
            <a
              href="mailto:anthony@saccosphere.co.ke?subject=Backend%20engineer%20role"
              className="whitespace-nowrap rounded-lg border border-rule bg-surface px-4 py-2 text-[12.5px] font-semibold text-ink hover:bg-white"
            >
              Apply
            </a>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-soft">
            Don&rsquo;t see a fit but think you should be here anyway? Email us — we read every one.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-28 border-b border-rule bg-surface py-20">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <SectionLabel>Contact</SectionLabel>
          <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.2rem]">
            Talk to us directly
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="mailto:anthony@saccosphere.co.ke"
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <IconMail className="h-4 w-4" />
              anthony@saccosphere.co.ke
            </a>
          </div>
        </div>
      </section>

      <CTABand
        title={<>Still deciding which page you need? <em className="italic text-violet-light">Start here.</em></>}
        body="Running a SACCO, a member of one, or doing diligence — there's a page built for exactly that."
        buttons={[
          { label: 'For SACCOs', href: '/for-saccos' },
          { label: 'For members', href: '/for-members', variant: 'secondary' },
        ]}
      />
    </main>
  )
}
