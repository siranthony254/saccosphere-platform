type CTAButton = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type CTABandProps = {
  id?: string
  title: React.ReactNode
  body: string
  buttons: CTAButton[]
}

// The one navy "bookend" moment every page that isn't Home gets at its
// close — same glow treatment, so the brand's dark moments stay consistent
// and rare rather than diluted across every section.
export function CTABand({ id, title, body, buttons }: CTABandProps) {
  return (
    <section id={id} className="relative overflow-hidden bg-navy py-20 sm:py-24">
      <div className="glow -top-10 right-[10%] h-[200px] w-[300px] bg-violet/30" />
      <div className="glow bottom-0 left-[20%] h-[150px] w-[200px] bg-mint/20" />

      <div className="relative z-10 mx-auto max-w-page px-6 sm:px-10">
        <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-white sm:text-[2.6rem]">{title}</h2>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/55">{body}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          {buttons.map((b) => (
            <a
              key={b.label}
              href={b.href}
              className={
                b.variant === 'secondary'
                  ? 'rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10'
                  : 'rounded-lg bg-mint px-6 py-3.5 text-[14px] font-semibold text-navy transition-opacity hover:opacity-90'
              }
            >
              {b.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
