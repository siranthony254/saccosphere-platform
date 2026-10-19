'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/platform', label: 'Platform' },
  { href: '/for-saccos', label: 'For SACCOs' },
  { href: '/for-members', label: 'For Members' },
  { href: '/network', label: 'Network' },
  { href: '/security', label: 'Security' },
  { href: '/company', label: 'Company' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-wide items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="font-serif text-lg text-white" onClick={() => setOpen(false)}>
          SaccoSphere
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[13px] font-medium transition-colors ${
                  active ? 'text-mint-light' : 'text-white/60 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/for-saccos#demo"
            className="hidden rounded-lg bg-mint px-4 py-2 text-[13px] font-semibold text-navy transition-opacity hover:opacity-90 sm:inline-block"
          >
            Request a demo
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" strokeWidth={1.8}>
              <g className="stroke-current fill-none" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </g>
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-2 py-2.5 text-[14px] font-medium ${
                    active ? 'text-mint-light' : 'text-white/70'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
            <Link
              href="/for-saccos#demo"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-mint px-4 py-2.5 text-center text-[13px] font-semibold text-navy sm:hidden"
            >
              Request a demo
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
