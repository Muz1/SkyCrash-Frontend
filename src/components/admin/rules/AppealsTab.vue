<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminPanel from '../AdminPanel.vue'
import AdminButton from '../AdminButton.vue'
import AdminPill from '../AdminPill.vue'
import ReasonDialog from '../ReasonDialog.vue'
import { getAppeals, resolveAppeal } from '@/services/adminRulesService'
import { dateTime } from '@/lib/reportFormat'
import type { Appeal } from '@/types/admin'

const rows = ref<Appeal[]>([])
const loading = ref(false)
const error = ref('')
const resolving = ref<{ appeal: Appeal; overturn: boolean } | null>(null)
const dialog = ref<InstanceType<typeof ReasonDialog> | null>(null)
const showClosed = ref(false)

const open = computed(() => rows.value.filter((a) => a.status === 'Open'))
const shown = computed(() => (showClosed.value ? rows.value : open.value))

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await getAppeals()
  } catch {
    error.value = 'Appeals could not be loaded.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function resolve(response: string) {
  if (!resolving.value) return
  try {
    await resolveAppeal(resolving.value.appeal.id, resolving.value.overturn, response)
    resolving.value = null
    await load()
  } catch (err) {
    dialog.value?.fail(err)
  }
}

const tone = (s: string) => (s === 'Open' ? 'warning' : s === 'Overturned' ? 'success' : 'neutral')
</script>

<template>
  <AdminPanel title="Appeals" :caption="`${open.length} open`" accent="blue">
    <template #actions>
      <label class="adm-switch">
        <input v-model="showClosed" type="checkbox" />
        <span class="adm-switch-track" aria-hidden="true" />
        <span>Show resolved</span>
      </label>
    </template>
    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
    <ul v-if="shown.length" class="adm-checks">
      <li v-for="a in shown" :key="a.id">
        <div class="adm-check-head">
          <AdminPill :label="a.status" :tone="tone(a.status)" />
          <p>
            <strong>{{ a.username }}</strong> · <span class="adm-mono">{{ a.ruleCode }}</span>
            <span class="adm-subline"> · {{ dateTime(a.createdAtUtc) }}</span>
          </p>
        </div>
        <p class="m-0 whitespace-pre-line text-[0.9375rem] text-[var(--adm-text)]">“{{ a.message }}”</p>
        <p v-if="a.response" class="adm-subline m-0">Response: {{ a.response }}</p>
        <div v-if="a.status === 'Open'" class="flex flex-wrap gap-2">
          <AdminButton size="sm" variant="secondary" @click="resolving = { appeal: a, overturn: false }">Uphold sanction</AdminButton>
          <AdminButton size="sm" variant="success" @click="resolving = { appeal: a, overturn: true }">Overturn (lift)</AdminButton>
        </div>
      </li>
    </ul>
    <p v-else class="adm-empty py-6">{{ loading ? 'Loading…' : showClosed ? 'No appeals yet.' : 'No open appeals.' }}</p>

    <ReasonDialog
      v-if="resolving"
      ref="dialog"
      :title="resolving.overturn ? `Overturn: lift ${resolving.appeal.ruleCode} on ${resolving.appeal.username}` : `Uphold ${resolving.appeal.ruleCode} on ${resolving.appeal.username}`"
      sub="The player sees this response."
      label="Response"
      :confirm="resolving.overturn ? 'Overturn' : 'Uphold'"
      :variant="resolving.overturn ? 'success' : 'primary'"
      placeholder="e.g. Thanks, we checked the logs and…"
      @close="resolving = null"
      @submit="resolve"
    />
  </AdminPanel>
</template>
