const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#network', label: 'Network' },
  { href: '#security', label: 'Security' },
  { href: '#directory', label: 'Find your SACCO' },
]

export function Footer() {
  return (
    <footer id="company" className="bg-navy py-14">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-serif text-lg text-white">SaccoSphere</div>
            <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-white/40">
              A technology and infrastructure provider to SACCOs — not a deposit-taking
              institution. Member funds move directly between members and their own SACCO.
            </p>
          </div>
          <nav className="flex flex-wrap gap-6">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[13px] text-white/50 hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white/30">
            As the network grows
          </div>
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-[12px] text-white/30">
            Press mentions and SACCO partners will appear here.
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-[11.5px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} SaccoSphere Ltd. All rights reserved.</div>
          <div>app.saccosphere.co.ke</div>
        </div>
      </div>
    </footer>
  )
}
