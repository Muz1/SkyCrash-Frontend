<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download } from '@lucide/vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import RulesList from '@/components/sky/RulesList.vue'
import RulesReviewModal from '@/components/sky/RulesReviewModal.vue'
import { useRulesStore } from '@/stores/rulesStore'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { downloadRulesPdf, effectiveDate } from '@/lib/rulesPdf'
import { en } from '@/copy/en'

/**
 * The Account rules, readable by anyone. A signed-in player with a newer version to accept
 * gets the review step (also reached from the "Rules updated" banner, or ?review=1).
 */
const route = useRoute()
const router = useRouter()
const rulesStore = useRulesStore()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const reviewing = ref(false)
const downloading = ref(false)

const isPlayer = computed(() => authStore.isAuthenticated && !!playerStore.profile && !playerStore.profile.isAdmin)

onMounted(async () => {
  void rulesStore.loadRules()
  if (isPlayer.value) {
    await rulesStore.loadStanding()
    if (route.query.review && rulesStore.mustAccept) reviewing.value = true
  }
})

async function download() {
  if (!rulesStore.ruleSet) return
  downloading.value = true
  try {
    await downloadRulesPdf(rulesStore.ruleSet)
  } finally {
    downloading.value = false
  }
}

function back() {
  if (window.history.length > 1) router.back()
  else void router.push('/')
}
</script>

<template>
  <div class="relative h-dvh overflow-y-auto overflow-x-hidden bg-void">
    <div class="fixed inset-0"><SkyEnvironment skin="midnight" :dim="0.6" /></div>
    <CRTOverlay />
    <main class="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(2rem,env(safe-area-inset-top))]">
      <Wordmark class="w-48" />
      <NeonPanel accent="magenta" class="mt-6 w-full">
        <h1 class="font-display text-2xl font-black uppercase tracking-[0.14em] text-foreground">{{ en.rules.title }}</h1>

        <template v-if="rulesStore.ruleSet">
          <p class="mt-1 font-arcade text-[0.5rem] uppercase leading-relaxed tracking-[0.2em] text-ember">
            {{ en.rules.version(rulesStore.ruleSet.label) }} ·
            {{ en.rules.effective(effectiveDate(rulesStore.ruleSet.effectiveFromUtc)) }}
          </p>

          <div v-if="isPlayer && rulesStore.mustAccept" class="mt-3 flex flex-wrap items-center gap-2 border-2 border-magenta/70 bg-magenta/10 p-2 text-sm">
            <span class="min-w-0 flex-1">{{ en.rules.updatedBanner }}</span>
            <ArcadeButton type="button" size="sm" variant="magenta" @click="reviewing = true">{{ en.rules.viewChanges }}</ArcadeButton>
          </div>

          <div class="mt-3 border-y border-violet/30">
            <RulesList :rules="rulesStore.activeRules" />
          </div>

          <div class="mt-5 flex flex-wrap justify-between gap-2">
            <ArcadeButton type="button" size="md" variant="ghost" @click="back">{{ en.common.back }}</ArcadeButton>
            <ArcadeButton type="button" size="md" variant="blue" :disabled="downloading" @click="download">
              <Download class="h-4 w-4" aria-hidden="true" /> {{ en.rules.download }}
            </ArcadeButton>
          </div>
        </template>
        <div v-else-if="rulesStore.ruleSetError" class="mt-3">
          <p role="alert" class="text-sm text-danger">{{ en.rules.loadError }}</p>
          <ArcadeButton type="button" size="sm" variant="ghost" class="mt-2" @click="rulesStore.loadRules(true)">{{ en.common.retry }}</ArcadeButton>
        </div>
        <p v-else class="mt-3 text-sm text-muted-foreground">{{ en.common.loading }}</p>
      </NeonPanel>
    </main>
    <RulesReviewModal v-if="reviewing" @close="reviewing = false" />
  </div>
</template>
