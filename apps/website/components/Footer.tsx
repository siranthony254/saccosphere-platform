import Link from 'next/link'

const PRODUCT_LINKS = [
  { href: '/platform', label: 'Platform' },
  { href: '/network', label: 'Network' },
  { href: '/security', label: 'Security & compliance' },
]

const AUDIENCE_LINKS = [
  { href: '/for-saccos', label: 'For SACCOs' },
  { href: '/for-members', label: 'For members' },
  { href: '/for-members#directory', label: 'Find your SACCO' },
]

const COMPANY_LINKS = [
  { href: '/company', label: 'About' },
  { href: '/company#careers', label: 'Careers' },
  { href: '/company#press', label: 'Press' },
  { href: '/company#contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of service' },
  { href: '/data-protection', label: 'Data protection' },
]

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">{title}</div>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[13px] text-white/60 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-navy pt-16">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <div className="grid grid-cols-2 gap-10 border-b border-white/10 pb-12 sm:grid-cols-5">
          <div className="col-span-2">
            <div className="font-serif text-lg text-white">SaccoSphere</div>
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-white/40">
              A technology and infrastructure provider to SACCOs — not a deposit-taking
              institution. Member funds move directly between members and their own SACCO.
            </p>
          </div>
          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Audience" links={AUDIENCE_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="py-6">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white/30">
            As the network grows
          </div>
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-[12px] text-white/30">
            Press mentions and SACCO partners will appear here.
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-[11.5px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/60">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} SaccoSphere Ltd. All rights reserved.</span>
            <span>app.saccosphere.co.ke</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
