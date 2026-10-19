import { Suspense } from 'react'
import Link from 'next/link'
import { LiveStats, LiveStatsSkeleton } from './LiveStats'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy pb-20 pt-32 sm:pt-40">
      <div className="glow -left-20 -top-16 h-[420px] w-[560px] bg-violet/40" />
      <div className="glow -right-16 top-10 h-[300px] w-[380px] bg-mint/25" />
      <div className="glow right-[28%] bottom-0 h-[220px] w-[300px] bg-violet/20" />

      <div className="relative z-10 mx-auto max-w-wide px-6 sm:px-10">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-mint-light">
          <span className="relative flex h-1.5 w-1.5 rounded-full bg-mint" />
          Live network status below
        </div>

        <h1 className="max-w-3xl font-serif text-[2.6rem] leading-[1.05] text-white sm:text-[3.6rem] md:text-[4.4rem]">
          The network <em className="italic text-violet-light">Kenya&rsquo;s cooperatives</em> run on
        </h1>

        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/55 sm:text-[18px]">
          One account for a member across every SACCO they belong to. One modern back office for
          every SACCO that runs one. A bank-grade ledger underneath both.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/for-saccos"
            className="rounded-lg bg-violet px-6 py-3.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            For SACCOs
          </Link>
          <Link
            href="/for-members"
            className="rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            For members
          </Link>
        </div>

        <Suspense fallback={<LiveStatsSkeleton />}>
          <LiveStats />
        </Suspense>
      </div>
    </section>
  )
}
