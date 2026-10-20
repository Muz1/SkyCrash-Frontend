<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SkyModal from './SkyModal.vue'
import ArcadeButton from './ArcadeButton.vue'
import RulesList from './RulesList.vue'
import { useRulesStore } from '@/stores/rulesStore'
import { useToastStore } from '@/stores/toastStore'
import { apiError } from '@/lib/apiError'
import { effectiveDate } from '@/lib/rulesPdf'
import { en } from '@/copy/en'

/** "Rules updated": what changed, the current rules, and Accept (POST /api/rules/me/accept). */
const emit = defineEmits<{ close: []; accepted: [] }>()
const rulesStore = useRulesStore()
const saving = ref(false)
const error = ref<string | null>(null)

onMounted(() => void rulesStore.loadRules(true))

async function accept() {
  const set = rulesStore.ruleSet
  if (!set) return
  saving.value = true
  error.value = null
  try {
    await rulesStore.accept(set.version)
    useToastStore().push({ title: en.rules.accepted, message: en.rules.version(set.label), accent: 'lime' })
    emit('accepted')
    emit('close')
  } catch (err) {
    if (apiError(err).status === 409) {
      // Published again while the player was reading: show the new version.
      error.value = en.rules.changedAgain
      await rulesStore.loadRules(true)
    } else {
      error.value = en.common.tryAgain
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <SkyModal :title="en.rules.reviewTitle" accent="magenta" width="lg" @close="emit('close')">
    <template v-if="rulesStore.ruleSet">
      <p class="font-arcade text-[0.5rem] uppercase tracking-[0.2em] text-ember">
        {{ en.rules.version(rulesStore.ruleSet.label) }} · {{ effectiveDate(rulesStore.ruleSet.effectiveFromUtc) }}
      </p>
      <p v-if="rulesStore.ruleSet.changeNote" class="mt-2 border-l-2 border-magenta pl-2 text-sm text-foreground">
        <span class="font-semibold">{{ en.rules.changeNote }}:</span> {{ rulesStore.ruleSet.changeNote }}
      </p>
      <div class="mt-3 max-h-[45dvh] overflow-y-auto overflow-x-hidden border-y border-violet/30">
        <RulesList :rules="rulesStore.activeRules" />
      </div>
    </template>
    <p v-else-if="rulesStore.ruleSetError" class="text-sm text-danger">{{ en.rules.loadError }}</p>
    <p v-else class="text-sm text-muted-foreground">{{ en.common.loading }}</p>
    <p v-if="error" role="alert" class="mt-3 text-sm font-semibold text-danger">{{ error }}</p>
    <template #footer>
      <ArcadeButton type="button" size="md" variant="ghost" @click="emit('close')">{{ en.common.close }}</ArcadeButton>
      <ArcadeButton type="button" size="md" variant="cash" :disabled="!rulesStore.ruleSet || saving" @click="accept">
        {{ saving ? en.common.saving : en.rules.accept }}
      </ArcadeButton>
    </template>
  </SkyModal>
</template>
