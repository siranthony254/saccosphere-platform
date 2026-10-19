'use client'

import { useEffect, useState } from 'react'

type InPageNavProps = {
  items: { id: string; label: string }[]
}

// A sticky sub-nav for long content pages (Platform, Security), with real
// scroll-spy via IntersectionObserver rather than a plain anchor list — the
// active item tracks whichever section is actually in view.
export function InPageNav({ items }: InPageNavProps) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  return (
    <div className="sticky top-[65px] z-30 hidden border-b border-rule bg-white/95 backdrop-blur-sm lg:block">
      <div className="mx-auto max-w-wide px-10">
        <nav className="flex gap-7 overflow-x-auto py-3.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`whitespace-nowrap text-[12.5px] font-medium transition-colors ${
                active === item.id ? 'text-violet' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
