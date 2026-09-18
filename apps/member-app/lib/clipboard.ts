/**
 * Clipboard helpers. Nothing currently copied in the app is sensitive (the
 * referral code is meant to be shared), but this exists so any future
 * account-number/reference copy can opt into auto-clearing without a fresh
 * clipboard API to wire up.
 */

import * as Clipboard from 'expo-clipboard'

const DEFAULT_CLEAR_DELAY_MS = 30_000

/**
 * Copies `text`, then clears the clipboard after `delayMs` — but only if
 * nothing else has since overwritten it (checked via getStringAsync so this
 * never clobbers something the user copied afterward).
 */
export async function copyWithAutoClear(text: string, delayMs = DEFAULT_CLEAR_DELAY_MS) {
  await Clipboard.setStringAsync(text)
  setTimeout(async () => {
    try {
      const current = await Clipboard.getStringAsync()
      if (current === text) {
        await Clipboard.setStringAsync('')
      }
    } catch {
      /* clipboard read/write can fail if the app is backgrounded; not critical */
    }
  }, delayMs)
}
