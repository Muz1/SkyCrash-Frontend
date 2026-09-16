import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import type { CraftId } from '@/lib/craft'
import type { SkinId } from '@/lib/skins'

interface StoredLoadout {
  craftId?: CraftId
  skinId?: SkinId
}

export const useHangarStore = defineStore('hangar', () => {
  const authStore = useAuthStore()
  const craftId = ref<CraftId>('jet')
  const skinId = ref<SkinId>('sunset-runway')

  function storageKey() {
    return `skycrash_hangar_${authStore.playerId ?? 'guest'}`
  }

  function load() {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as StoredLoadout
      if (parsed.craftId) craftId.value = parsed.craftId
      if (parsed.skinId) skinId.value = parsed.skinId
    } catch {
      // ignore corrupt storage
    }
  }

  function persist() {
    localStorage.setItem(storageKey(), JSON.stringify({ craftId: craftId.value, skinId: skinId.value }))
  }

  function setCraft(id: CraftId) {
    craftId.value = id
    persist()
  }

  function setSkin(id: SkinId) {
    skinId.value = id
    persist()
  }

  watch(() => authStore.playerId, load, { immediate: true })

  return { craftId, skinId, setCraft, setSkin }
})
