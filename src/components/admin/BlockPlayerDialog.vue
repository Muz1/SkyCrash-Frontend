<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { Ban, CircleAlert } from '@lucide/vue'
import AdminDialog from './AdminDialog.vue'
import AdminButton from './AdminButton.vue'
import AdminInfo from './AdminInfo.vue'
import { getAdminRules } from '@/services/adminRulesService'
import { RULE_ACTIONS, type AccountRule } from '@/types/admin'
import { admin as copy } from '@/copy/admin'

/** Block = apply an Account Rule. No free-text-only blocks: the rule is required. */
const props = defineProps<{ username: string }>()
const emit = defineEmits<{
  close: []
  submit: [body: { ruleCode: string; durationDays: number | null; internalNote?: string }]
}>()

const rules = ref<AccountRule[]>([])
const version = ref('')
const loading = ref(true)
const loadError = ref('')
const ruleCode = ref('')
const duration = ref<number | ''>('')
const note = ref('')
const error = ref('')
const busy = ref(false)

const rule = computed(() => rules.value.find((r) => r.code === ruleCode.value) ?? null)
const actionLabel = (a: string) => RULE_ACTIONS.find((x) => x.id === a)?.label ?? a

watch(rule, (r) => {
  duration.value = r?.defaultDurationDays ?? ''
})

onMounted(async () => {
  try {
    const res = await getAdminRules()
    rules.value = res.current.rules.filter((r) => r.isActive)
    version.value = res.current.label
  } catch {
    loadError.value = 'The rules could not be loaded, so nobody can be blocked right now. Try again.'
  } finally {
    loading.value = false
  }
})

async function submit() {
  error.value = ''
  if (!rule.value) {
    error.value = 'Pick the rule this block is for.'
    return
  }
  const days = duration.value === '' ? null : Number(duration.value)
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
    error.value = 'Days must be a whole number from 1 to 3650, or empty for the rule default.'
    return
  }
  busy.value = true
  try {
    emit('submit', { ruleCode: rule.value.code, durationDays: days, internalNote: note.value.trim() || undefined })
  } finally {
    busy.value = false
  }
}

defineExpose({
  fail(err: unknown) {
    error.value =
      (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ??
      'The block could not be applied.'
  },
})
</script>

<template>
  <AdminDialog :title="`${copy.players.blockTitle}: ${props.username}`" :sub="copy.players.blockSub" tone="#ef4444" @close="emit('close')">
    <template #icon><Ban /></template>

    <p v-if="loading" class="adm-note">Loading rules…</p>
    <p v-else-if="loadError" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ loadError }}</p>
    <template v-else>
      <label class="block">
        <span class="adm-label">Rule ({{ version }})</span>
        <select v-model="ruleCode" class="adm-select w-full" required>
          <option value="" disabled>Pick a rule…</option>
          <option v-for="r in rules" :key="r.code" :value="r.code">{{ r.code }} · {{ r.title }} ({{ actionLabel(r.action) }})</option>
        </select>
      </label>

      <div v-if="rule" class="adm-callout adm-callout--info">
        <span>
          <strong>{{ rule.title }}</strong> — {{ rule.summary }}
          <AdminInfo :term="rule.title" :text="rule.details || rule.summary" />
          <br />
          <span class="adm-subline">
            Action: {{ actionLabel(rule.action) }} · Default:
            {{ rule.defaultDurationDays ? `${rule.defaultDurationDays} days` : 'permanent / not time-bound' }} ·
            {{ rule.appealable ? 'Appealable' : 'Not appealable' }}
          </span>
        </span>
      </div>

      <label class="block">
        <span class="adm-label">Duration (days)</span>
        <input v-model="duration" type="number" min="1" max="3650" step="1" inputmode="numeric" class="adm-input adm-num w-full" placeholder="Rule default" />
        <p class="adm-field-hint">{{ copy.players.durationHint }}</p>
      </label>

      <label class="block">
        <span class="adm-label">Internal note (optional, admins only)</span>
        <textarea v-model="note" maxlength="500" class="adm-textarea" placeholder="e.g. Chargeback ref 1234" />
      </label>

      <p v-if="error" class="adm-error" role="alert"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>
    </template>

    <template #footer>
      <AdminButton variant="ghost" @click="emit('close')">Cancel</AdminButton>
      <AdminButton variant="danger-solid" :disabled="busy || loading || !!loadError || !ruleCode" @click="submit">Apply block</AdminButton>
    </template>
  </AdminDialog>
</template>
