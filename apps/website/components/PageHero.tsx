type PageHeroProps = {
  eyebrow: string
  title: React.ReactNode
  subtitle?: string
}

// The compact navy hero used on every sub-page — same bookend treatment as
// Home's hero and the closing CTA, scaled down since a sub-page needs to get
// to its content fast, not re-sell the whole company.
export function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy pb-16 pt-28 sm:pt-32">
      <div className="glow -left-24 -top-20 h-[280px] w-[380px] bg-violet/30" />
      <div className="glow right-[5%] top-0 h-[180px] w-[240px] bg-mint/15" />

      <div className="relative z-10 mx-auto max-w-wide px-6 sm:px-10">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-mint-light">
          {eyebrow}
        </div>
        <h1 className="max-w-2xl font-serif text-[2.3rem] leading-[1.08] text-white sm:text-[3rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55 sm:text-[16px]">{subtitle}</p>}
      </div>
    </section>
  )
}
