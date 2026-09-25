import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Reveal state for the bottom NavDock. The dock is pinned open on Home and
 * auto-hidden everywhere else; `revealed` is the temporary "slide it back up"
 * state (desktop: cursor at the screen's bottom edge, touch: the arrow tab).
 */
export const useNavDockStore = defineStore('navDock', () => {
  const revealed = ref(false)

  function reveal() {
    revealed.value = true
  }
  function hide() {
    revealed.value = false
  }
  function toggle() {
    revealed.value = !revealed.value
  }

  return { revealed, reveal, hide, toggle }
})
