import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Phones and small tablets in portrait: below Tailwind's `md` breakpoint (768px). */
export const NARROW_SCREEN = '(max-width: 767.98px)'

/** Any phone: narrow in portrait, or short when held sideways (matches `landscape-phone:`). */
export const PHONE_SCREEN = `${NARROW_SCREEN}, (orientation: landscape) and (max-height: 500px)`

/** Reactive `matchMedia`: true while the query matches, updated on resize/rotation. */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)
  let media: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => (matches.value = e.matches)

  onMounted(() => {
    media = window.matchMedia?.(query) ?? null
    matches.value = media?.matches ?? false
    media?.addEventListener('change', onChange)
  })
  onBeforeUnmount(() => media?.removeEventListener('change', onChange))

  return matches
}
