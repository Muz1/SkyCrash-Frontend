import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as rulesService from '@/services/rulesService'
import type { AccountRuleSet, AccountStanding } from '@/types'

/**
 * The Account rules (public) and the signed-in player's standing: status badge, active
 * sanctions, and whether a newer rule set must be accepted before the next bet.
 */
export const useRulesStore = defineStore('rules', () => {
  const ruleSet = ref<AccountRuleSet | null>(null)
  const ruleSetError = ref(false)
  const standing = ref<AccountStanding | null>(null)
  let ruleRequest: Promise<AccountRuleSet | null> | null = null

  const activeRules = computed(() => ruleSet.value?.rules.filter((r) => r.isActive) ?? [])
  const mustAccept = computed(() => !!standing.value?.mustAcceptRules)

  function loadRules(force = false) {
    if (force) ruleRequest = null
    ruleRequest ??= rulesService
      .getRules()
      .then((set) => {
        ruleSetError.value = false
        return (ruleSet.value = set)
      })
      .catch(() => {
        ruleSetError.value = true
        ruleRequest = null
        return null
      })
    return ruleRequest
  }

  async function loadStanding() {
    try {
      standing.value = await rulesService.getMyStanding()
    } catch {
      // Older server or signed out: no badge, no banner.
    }
    return standing.value
  }

  /** Accept the version the player was shown (the server refuses a stale one with 409). */
  async function accept(version: number) {
    await rulesService.acceptRules(version)
    if (standing.value) standing.value = { ...standing.value, mustAcceptRules: false, acceptedRuleSetVersion: version }
  }

  function clear() {
    standing.value = null
  }

  return { ruleSet, ruleSetError, standing, activeRules, mustAccept, loadRules, loadStanding, accept, clear }
})
