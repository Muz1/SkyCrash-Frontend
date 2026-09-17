import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminSettingsService from '@/services/adminSettingsService'
import type { GameSettings } from '@/types'

export const useAdminSettingsStore = defineStore('adminSettings', () => {
  const settings = ref<GameSettings | null>(null)
  const isLoading = ref(false)

  async function fetchSettings() {
    isLoading.value = true
    try {
      settings.value = await adminSettingsService.getSettings()
    } finally {
      isLoading.value = false
    }
  }

  async function updateHouseEdge(houseEdgePercentage: number, password: string) {
    settings.value = await adminSettingsService.updateHouseEdge(houseEdgePercentage, password)
  }

  return { settings, isLoading, fetchSettings, updateHouseEdge }
})
