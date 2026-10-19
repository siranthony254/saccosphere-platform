type LegalLayoutProps = {
  title: string
  children: React.ReactNode
}

// Shared shell for the legal pages. These are drafting templates, not
// counsel-approved policy — the banner says so plainly rather than letting
// a visitor mistake draft text for SaccoSphere's actual binding terms.
export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <main>
      <section className="border-b border-rule bg-surface pb-12 pt-28 sm:pt-32">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <h1 className="font-serif text-[2rem] text-ink sm:text-[2.4rem]">{title}</h1>
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-[12.5px] leading-relaxed text-ink-soft">
            <strong className="text-ink">Draft — pending legal review.</strong> This page is a
            structural template for counsel to review and finalize before it governs any real
            account. It is not yet SaccoSphere&rsquo;s binding policy.
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-page px-6 sm:px-10">
          <div className="prose-legal space-y-8">{children}</div>
        </div>
      </section>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-[16px] font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-[13.5px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  )
}
