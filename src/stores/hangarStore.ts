import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import * as playerService from '@/services/playerService'
import { CRAFTS, DEFAULT_CRAFT, type CraftId } from '@/lib/craft'
import { DEFAULT_SKIN, SKY_SKINS, type SkinId } from '@/lib/skins'

interface StoredLoadout {
  craftId?: CraftId
  skinId?: SkinId
  /** False while a change made here hasn't reached the server yet. */
  synced?: boolean
}

function validCraft(id: unknown): CraftId | null {
  return CRAFTS.find((c) => c.id === id)?.id ?? null
}

function validSkin(id: unknown): SkinId | null {
  return SKY_SKINS.find((s) => s.id === id)?.id ?? null
}

/**
 * The player's equipped plane and sky. The server profile is the source of
 * truth; localStorage is an offline cache, so the hangar works (and remembers)
 * even when the loadout endpoint can't be reached.
 */
export const useHangarStore = defineStore('hangar', () => {
  const authStore = useAuthStore()
  const playerStore = usePlayerStore()
  const craftId = ref<CraftId>(DEFAULT_CRAFT)
  const skinId = ref<SkinId>(DEFAULT_SKIN)
  /** Whether the last equip reached the server (false = saved on this device only). */
  const savedToServer = ref(true)
  /** A non-default plane or sky (see DEFAULT_CRAFT / DEFAULT_SKIN) is equipped: hangar navigation glows to show it. */
  const isCustomized = computed(() => craftId.value !== DEFAULT_CRAFT || skinId.value !== DEFAULT_SKIN)

  // The server value is only adopted once per signed-in player, so a profile
  // refetch (after every bet) can't undo an equip that's still being saved.
  let reconciledFor: string | null = null
  let stored: StoredLoadout | null = null

  function storageKey() {
    return `skycrash_hangar_${authStore.playerId ?? 'guest'}`
  }

  function load() {
    reconciledFor = null
    stored = null
    craftId.value = DEFAULT_CRAFT
    skinId.value = DEFAULT_SKIN
    try {
      const raw = localStorage.getItem(storageKey())
      if (raw) stored = JSON.parse(raw) as StoredLoadout
    } catch {
      // ignore corrupt or unavailable storage
    }
    craftId.value = validCraft(stored?.craftId) ?? DEFAULT_CRAFT
    skinId.value = validSkin(stored?.skinId) ?? DEFAULT_SKIN
    if (playerStore.profile) reconcile()
  }

  function persist(synced: boolean) {
    stored = { craftId: craftId.value, skinId: skinId.value, synced }
    try {
      localStorage.setItem(storageKey(), JSON.stringify(stored))
    } catch {
      // Non-fatal: the server copy still holds the loadout.
    }
  }

  async function pushToServer() {
    if (!authStore.isAuthenticated) return
    const sent = { craft: craftId.value, skin: skinId.value }
    try {
      await playerService.saveLoadout(sent.craft, sent.skin)
      // Only mark synced if nothing changed while the request was in flight.
      if (craftId.value === sent.craft && skinId.value === sent.skin) {
        savedToServer.value = true
        persist(true)
      }
    } catch {
      savedToServer.value = false
    }
  }

  /** Merge the profile's saved loadout with the local cache, once per player. */
  function reconcile() {
    const profile = playerStore.profile
    if (!profile || !authStore.playerId || profile.playerId !== authStore.playerId) return
    if (reconciledFor === profile.playerId) return
    reconciledFor = profile.playerId

    // An equip made offline is newer than whatever the server has.
    if (stored && stored.synced === false) {
      void pushToServer()
      return
    }
    const serverCraft = validCraft(profile.equippedCraftId)
    const serverSkin = validSkin(profile.equippedSkyId)
    if (serverCraft) craftId.value = serverCraft
    if (serverSkin) skinId.value = serverSkin
    if (serverCraft && serverSkin) {
      persist(true)
    } else if (stored) {
      // Server has never seen a loadout but this device has one: push it up once.
      void pushToServer()
    }
  }

  function setCraft(id: CraftId) {
    craftId.value = id
    persist(false)
    void pushToServer()
  }

  function setSkin(id: SkinId) {
    skinId.value = id
    persist(false)
    void pushToServer()
  }

  watch(() => authStore.playerId, load, { immediate: true })
  watch(() => playerStore.profile, reconcile)

  return { craftId, skinId, isCustomized, savedToServer, setCraft, setSkin }
})
