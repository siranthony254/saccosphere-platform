import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface InfoTipProps {
  /** Plain-language explanation shown in the popover. Keep it one or two short sentences. */
  text: string
  /** Accessible name for the trigger button — what a screen reader announces. Defaults to a generic "More information". */
  label?: string
  /** 'top' opens the popover above the trigger instead of below — use it for a row near the bottom of the screen. */
  placement?: 'bottom' | 'top'
  className?: string
}

const GAP = 8
const WIDTH = 240

/**
 * A small "?" trigger that reveals a plain-language explanation — on hover,
 * on keyboard focus, or on click/tap (hover doesn't exist on touch devices,
 * so click is the primary mechanism there). Dismisses on Escape or a click
 * outside. The popover itself renders through a portal with fixed
 * positioning computed from the trigger's own position, so it is never
 * clipped by a scrolling sidebar, table or tab bar — built once here so
 * every page in every admin app gets the same accessible behavior instead
 * of a one-off per screen.
 */
export function InfoTip({ text, label = 'More information', placement = 'bottom', className = '' }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const tooltipId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  const reposition = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.min(Math.max(rect.left + rect.width / 2 - WIDTH / 2, 8), window.innerWidth - WIDTH - 8)
    const top = placement === 'top' ? rect.top - GAP : rect.bottom + GAP
    setCoords({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) return
    reposition()
  }, [open, placement])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onPointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onReposition = () => reposition()
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, placement])

  return (
    <span ref={wrapperRef} className={`relative inline-flex ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-current text-[9px] font-bold leading-none text-ink-muted/70 transition-colors hover:text-violet-700 hover:border-violet-700 focus-visible:text-violet-700 focus-visible:border-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 cursor-help"
      >
        ?
      </button>
      {open && coords && typeof document !== 'undefined' &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: WIDTH, transform: placement === 'top' ? 'translateY(-100%)' : undefined }}
            className="z-[999] rounded-lg bg-ink px-3 py-2 text-[11px] font-normal normal-case leading-snug text-white shadow-lg"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}
