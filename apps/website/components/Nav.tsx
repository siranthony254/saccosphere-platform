const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#network', label: 'Network' },
  { href: '#security', label: 'Security' },
  { href: '#company', label: 'Company' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-navy/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-wide items-center justify-between px-6 py-4 sm:px-10">
        <a href="#top" className="font-serif text-lg text-white">
          SaccoSphere
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#demo"
          className="rounded-lg bg-mint px-4 py-2 text-[13px] font-semibold text-navy transition-opacity hover:opacity-90"
        >
          Request a demo
        </a>
      </div>
    </header>
  )
}
