import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBadgeViewerStore = defineStore('badgeViewer', () => {
  const achievementKey = ref<string | null>(null)

  function open(key: string) {
    achievementKey.value = key
  }

  function close() {
    achievementKey.value = null
  }

  return { achievementKey, open, close }
})
