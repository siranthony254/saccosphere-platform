/**
 * Money formatting + the "hide balance" mask.
 *
 * `formatMoney` is the single canonical KES formatter — prefer it over inline
 * `KES ${x.toLocaleString()}` in new code.
 *
 * `useMoney()` returns a formatter that renders `KES ••••••` whenever the user
 * has hidden their balances (or the preference hasn't hydrated yet). Screens
 * that show the member's *own* figures should format through this hook so the
 * toggle covers every amount, not just the headline balance.
 */

import { usePreferencesStore } from '../store/usePreferencesStore'

export const MONEY_MASK = '••••••'

export function formatMoney(value?: number | null): string {
  return `KES ${Number(value ?? 0).toLocaleString('en-KE')}`
}

export function maskedMoney(): string {
  return `KES ${MONEY_MASK}`
}

/** Subscribe to the hide-balance preference. */
export function useBalanceHidden(): boolean {
  return usePreferencesStore((s) => s.balanceHidden || !s._hydrated)
}

/** A KES formatter that respects the hide-balance preference. */
export function useMoney(): (value?: number | null) => string {
  const hidden = useBalanceHidden()
  return (value) => (hidden ? maskedMoney() : formatMoney(value))
}
