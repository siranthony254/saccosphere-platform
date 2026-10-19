'use client'

import { useEffect, useState } from 'react'
import { SectionLabel } from './SectionLabel'
import { IconSearch, IconArrowRight } from './icons'
import { SECTORS } from '@/lib/constants'
import type { SaccoListing } from '@/lib/api'

export function SaccoDirectory() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<string | null>(null)
  const [results, setResults] = useState<SaccoListing[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        if (search.trim()) query.set('search', search.trim())
        if (sector) query.set('sector', sector)
        const res = await fetch(`/api/saccos?${query.toString()}`, { signal: controller.signal })
        const body = await res.json()
        setResults(Array.isArray(body.results) ? body.results : [])
      } catch {
        // aborted or network error — leave previous results in place
      } finally {
        setLoading(false)
        setHasSearched(true)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, sector])

  return (
    <section id="directory" className="border-b border-rule bg-surface py-20">
      <div className="mx-auto max-w-page px-6 sm:px-10">
        <SectionLabel>The network</SectionLabel>
        <h2 className="max-w-2xl font-serif text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
          Is your SACCO already <em className="italic">on here?</em>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Every publicly-listed SACCO on the network, searched live from the platform&rsquo;s own
          directory — not a snapshot taken for this page.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SACCO name…"
              className="w-full rounded-lg border border-rule bg-white py-3 pl-10 pr-4 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-violet"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setSector(null)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              sector === null ? 'border-violet bg-violet text-white' : 'border-rule bg-white text-ink-soft hover:border-violet/40'
            }`}
          >
            All sectors
          </button>
          {SECTORS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSector(sector === s.value ? null : s.value)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                sector === s.value ? 'border-violet bg-violet text-white' : 'border-rule bg-white text-ink-soft hover:border-violet/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-8 min-h-[140px]">
          {loading ? (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-card border border-rule bg-white" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
            >
              {results.slice(0, 9).map((s) => (
                <div key={s.id} className="rounded-card border border-rule bg-white p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-semibold text-ink">{s.name}</div>
                    {s.is_verified && (
                      <span className="shrink-0 rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[12px] text-ink-soft">
                    {[s.sector, s.county].filter(Boolean).join(' · ') || 'Sector not listed'}
                  </div>
                  <div className="mt-3 text-[12px] font-medium text-violet">
                    {s.member_count.toLocaleString()} members
                    {s.membership_open ? ' · Open to new members' : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="rounded-card border border-dashed border-rule bg-white px-6 py-10 text-center">
              <p className="text-[13.5px] text-ink-soft">
                No publicly-listed SACCO matches that search yet — the network is still growing.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-card border border-gold/30 bg-gold/5 p-6">
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            Don&rsquo;t see your SACCO? Bring it onto the network and give your members the same
            unified portfolio — in weeks, not a core-banking migration project.
          </p>
          <a
            href="/for-saccos#demo"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-navy px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Bring your SACCO onto the network
            <IconArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
