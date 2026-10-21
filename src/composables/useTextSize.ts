import { ref } from 'vue'

/** Text-size setting (accessibility): 100%, 125% or 150%, remembered on this device. */
export const TEXT_SIZES = [100, 125, 150] as const
export type TextSize = (typeof TEXT_SIZES)[number]

const STORAGE_KEY = 'skycrash_text_size'

function readStored(): TextSize {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    return (TEXT_SIZES as readonly number[]).includes(n) ? (n as TextSize) : 100
  } catch {
    return 100
  }
}

/**
 * Applies the size to <html>: data-text-size drives the text-token overrides in style.css and
 * --text-scale is the multiplier. 100% removes both, so the default look is untouched.
 */
function apply(size: TextSize) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (size === 100) {
    delete root.dataset.textSize
    root.style.removeProperty('--text-scale')
  } else {
    root.dataset.textSize = String(size)
    root.style.setProperty('--text-scale', String(size / 100))
  }
}

const current = ref<TextSize>(100)

/** Call once at start-up (main.ts) so the saved size applies before the first paint. */
export function applyStoredTextSize() {
  current.value = readStored()
  apply(current.value)
}

export function useTextSize() {
  function set(size: TextSize) {
    current.value = size
    apply(size)
    try {
      localStorage.setItem(STORAGE_KEY, String(size))
    } catch {
      // Not saved: it still applies until the page reloads.
    }
  }
  return { size: current, sizes: TEXT_SIZES, set }
}
