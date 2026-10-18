export function ClosingCta() {
  return (
    <section id="demo" className="relative overflow-hidden bg-navy py-24">
      <div className="glow -top-10 right-[10%] h-[200px] w-[300px] bg-violet/30" />
      <div className="glow bottom-0 left-[20%] h-[150px] w-[200px] bg-mint/20" />

      <div className="relative z-10 mx-auto max-w-page px-6 sm:px-10">
        <h2 className="max-w-xl font-serif text-[2rem] leading-tight text-white sm:text-[2.8rem]">
          Kenya&rsquo;s cooperatives are ready for infrastructure. <em className="italic text-violet-light">We built it.</em>
        </h2>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/55">
          14 million SACCO members. KES 900 billion in assets. Thousands of institutions still
          running on desktop software and manual reconciliation. Talk to us about bringing your
          SACCO — or your members — onto the network.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="mailto:anthony@saccosphere.co.ke"
            className="rounded-lg bg-mint px-6 py-3.5 text-[14px] font-semibold text-navy transition-opacity hover:opacity-90"
          >
            Request a demo
          </a>
          <a
            href="#directory"
            className="rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Find your SACCO
          </a>
        </div>
      </div>
    </section>
  )
}
