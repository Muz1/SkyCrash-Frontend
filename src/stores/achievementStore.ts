import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as achievementService from '@/services/achievementService'
import type { Achievement } from '@/types'

export const useAchievementStore = defineStore('achievement', () => {
  const achievements = ref<Achievement[]>([])
  const isLoading = ref(false)

  async function fetchAchievements() {
    isLoading.value = true
    try {
      achievements.value = await achievementService.getMyAchievements()
    } finally {
      isLoading.value = false
    }
  }

  async function setDisplayed(achievementKey: string | null) {
    await achievementService.setDisplayedAchievement(achievementKey)
    achievements.value = achievements.value.map((a) => ({ ...a, isDisplayed: a.key === achievementKey }))
  }

  function clear() {
    achievements.value = []
  }

  return { achievements, isLoading, fetchAchievements, setDisplayed, clear }
})
