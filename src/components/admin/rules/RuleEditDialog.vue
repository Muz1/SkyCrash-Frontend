<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import axios from 'axios'
import { CircleAlert, ScrollText } from '@lucide/vue'
import AdminDialog from '../AdminDialog.vue'
import AdminButton from '../AdminButton.vue'
import { updateRule } from '@/services/adminRulesService'
import { RULE_ACTIONS, type AccountRule, type RuleSet } from '@/types/admin'
import { admin as copy } from '@/copy/admin'

/** Edit one rule. Saving publishes a new rule-set version with the change note. */
const props = defineProps<{ rule: AccountRule; version: string }>()
const emit = defineEmits<{ close: []; published: [set: RuleSet] }>()

const form = reactive({
  title: props.rule.title,
  summary: props.rule.summary,
  details: props.rule.details,
  action: props.rule.action,
  defaultDurationDays: (props.rule.defaultDurationDays ?? '') as number | '',
  appealable: props.rule.appealable,
  isActive: props.rule.isActive,
  changeNote: '',
})
const error = ref('')
const busy = ref(false)

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const titleWords = computed(() => words(form.title))
const summaryWords = computed(() => words(form.summary))
const timed = computed(() => form.action === 'TemporaryBlock' || form.action === 'Escalating')

async function save() {
  error.value = ''
  if (titleWords.value < 1 || titleWords.value > 5) return void (error.value = 'Title: 3–5 words (5 at most).')
  if (summaryWords.value > 12) return void (error.value = 'Summary: 12 words or fewer.')
  if (!form.details.trim()) return void (error.value = 'Details are required.')
  if (!form.changeNote.trim()) return void (error.value = copy.rules.changeNoteRequired)
  const days = form.defaultDurationDays === '' ? null : Number(form.defaultDurationDays)
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
    return void (error.value = 'Default days: a whole number from 1 to 3650, or empty.')
  }
  busy.value = true
  try {
    const set = await updateRule(props.rule.code, {
      title: form.title.trim(),
      summary: form.summary.trim(),
      details: form.details.trim(),
      action: form.action,
      defaultDurationDays: days,
      appealable: form.appealable,
      isActive: form.isActive,
      changeNote: form.changeNote.trim(),
    })
    emit('published', set)
  } catch (err) {
    error.value =
      (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ??
      'The rule could not be saved.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AdminDialog :title="`Edit ${rule.code} (${version})`" sub="Saving publishes a new rule-set version. Players accept it before they next bet." wide @close="emit('close')">
    <template #icon><ScrollText /></template>

    <label class="block">
      <span class="adm-label">Title</span>
      <input v-model="form.title" type="text" maxlength="80" class="adm-input w-full" />
      <p class="adm-field-hint" :class="{ 'text-[#ef4444]': titleWords > 5 }">{{ titleWords }} words · 3–5 words</p>
    </label>
    <label class="block">
      <span class="adm-label">Summary</span>
      <input v-model="form.summary" type="text" maxlength="160" class="adm-input w-full" />
      <p class="adm-field-hint" :class="{ 'text-[#ef4444]': summaryWords > 12 }">{{ summaryWords }} / 12 words</p>
    </label>
    <label class="block">
      <span class="adm-label">Details (shown behind the ⓘ)</span>
      <textarea v-model="form.details" maxlength="1000" class="adm-textarea" />
    </label>
    <div class="adm-field-row">
      <label class="block">
        <span class="adm-label">Action</span>
        <select v-model="form.action" class="adm-select w-full">
          <option v-for="a in RULE_ACTIONS" :key="a.id" :value="a.id">{{ a.label }}</option>
        </select>
      </label>
      <label class="block">
        <span class="adm-label">Default days</span>
        <input
          v-model="form.defaultDurationDays"
          type="number"
          min="1"
          max="3650"
          step="1"
          inputmode="numeric"
          class="adm-input adm-num w-full"
          :placeholder="timed ? 'e.g. 7' : 'None'"
        />
      </label>
    </div>
    <div class="flex flex-wrap gap-x-6 gap-y-1">
      <label class="adm-check"><input v-model="form.appealable" type="checkbox" /> Appealable</label>
      <label class="adm-check"><input v-model="form.isActive" type="checkbox" /> Active</label>
    </div>
    <label class="block">
      <span class="adm-label">Change note (required)</span>
      <input v-model="form.changeNote" type="text" maxlength="200" class="adm-input w-full" placeholder="e.g. Shorter F2 block for first offences" />
    </label>

    <p v-if="error" class="adm-error" role="alert"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>

    <template #footer>
      <AdminButton variant="ghost" @click="emit('close')">Cancel</AdminButton>
      <AdminButton variant="primary" :disabled="busy" @click="save">{{ busy ? 'Publishing…' : 'Publish new version' }}</AdminButton>
    </template>
  </AdminDialog>
</template>
