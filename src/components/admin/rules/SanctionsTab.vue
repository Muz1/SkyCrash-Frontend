<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Sheet } from '@lucide/vue'
import AdminPanel from '../AdminPanel.vue'
import AdminButton from '../AdminButton.vue'
import AdminPill from '../AdminPill.vue'
import ReasonDialog from '../ReasonDialog.vue'
import { fetchFile, getSanctions, liftSanction } from '@/services/adminRulesService'
import { saveBlob, fileDate } from '@/lib/adminDownload'
import { actionLabel } from '@/lib/rulesReport'
import { dateTime } from '@/lib/reportFormat'
import type { AccountRule, AdminSanction } from '@/types/admin'

const props = defineProps<{ rules: AccountRule[] }>()

const filters = reactive({ rule: '', status: '', from: '', to: '' })
const rows = ref<AdminSanction[]>([])
const loading = ref(false)
const error = ref('')
const lifting = ref<AdminSanction | null>(null)
const liftDialog = ref<InstanceType<typeof ReasonDialog> | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await getSanctions({ ...filters })
  } catch {
    error.value = 'Sanctions could not be loaded.'
  } finally {
    loading.value = false
  }
}
watch(filters, load)
onMounted(load)

async function lift(reason: string) {
  if (!lifting.value) return
  try {
    await liftSanction(lifting.value.id, reason)
    lifting.value = null
    await load()
  } catch (err) {
    liftDialog.value?.fail(err)
  }
}

async function downloadCsv() {
  try {
    saveBlob(await fetchFile('/admin/sanctions/export.csv', { from: filters.from, to: filters.to }), `skycrash-sanctions-${fileDate()}.csv`)
  } catch {
    error.value = 'CSV download failed.'
  }
}

const statusTone = (s: string) => (s === 'Active' ? 'danger' : s === 'Lifted' ? 'info' : 'neutral')
const ruleTitle = (code: string) => props.rules.find((r) => r.code === code)?.title ?? code
</script>

<template>
  <AdminPanel title="Sanctions" :caption="`${rows.length} shown · every one cites a rule`" accent="ember" flush>
    <template #actions>
      <AdminButton size="sm" @click="downloadCsv"><Sheet aria-hidden="true" />CSV</AdminButton>
    </template>
    <template #toolbar>
      <div class="adm-toolbar flex-wrap">
        <select v-model="filters.rule" class="adm-select" aria-label="Rule">
          <option value="">Any rule</option>
          <option v-for="r in rules" :key="r.code" :value="r.code">{{ r.code }} · {{ r.title }}</option>
        </select>
        <select v-model="filters.status" class="adm-select" aria-label="Status">
          <option value="">Any status</option>
          <option>Active</option>
          <option>Expired</option>
          <option>Lifted</option>
        </select>
        <label class="flex items-center gap-2">
          <span class="adm-subline">From</span>
          <input v-model="filters.from" type="date" class="adm-input" aria-label="From date" :max="filters.to || undefined" />
        </label>
        <label class="flex items-center gap-2">
          <span class="adm-subline">To</span>
          <input v-model="filters.to" type="date" class="adm-input" aria-label="To date" :min="filters.from || undefined" />
        </label>
      </div>
    </template>

    <p v-if="error" class="adm-error mx-4 my-3" role="alert">{{ error }}</p>
    <div class="adm-table-wrap">
      <table class="adm-table adm-table--cards min-w-[62rem]">
        <thead>
          <tr>
            <th>Player</th>
            <th>Rule</th>
            <th>Action</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>By</th>
            <th class="adm-num">Lift</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in rows" :key="s.id">
            <td class="adm-strong" data-label="Player">{{ s.username }}</td>
            <td data-label="Rule" class="whitespace-normal">
              <span class="adm-mono">{{ s.ruleCode }}</span> · {{ s.ruleTitle || ruleTitle(s.ruleCode) }}
              <span class="adm-subline"> (v{{ s.ruleSetVersion }}.0)</span>
              <span v-if="s.internalNote" class="adm-subline block">Note: {{ s.internalNote }}</span>
              <span v-if="s.liftReason" class="adm-subline block">Lifted by {{ s.liftedBy }}: {{ s.liftReason }}</span>
            </td>
            <td data-label="Action">{{ actionLabel(s.action) }}</td>
            <td data-label="Status"><AdminPill :label="s.status" :tone="statusTone(s.status)" /></td>
            <td class="adm-num-inline" data-label="Start">{{ dateTime(s.startsAtUtc) }}</td>
            <td class="adm-num-inline" data-label="End">{{ s.endsAtUtc ? dateTime(s.endsAtUtc) : 'Permanent' }}</td>
            <td data-label="By">{{ s.appliedBy }}</td>
            <td class="adm-actions">
              <div>
                <AdminButton v-if="s.status === 'Active'" size="sm" variant="success" @click="lifting = s">Lift</AdminButton>
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="8" class="adm-empty">{{ loading ? 'Loading…' : 'No sanctions match these filters.' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReasonDialog
      v-if="lifting"
      ref="liftDialog"
      :title="`Lift ${lifting.ruleCode} on ${lifting.username}`"
      sub="The player regains access at once. The reason goes into the audit log."
      confirm="Lift sanction"
      variant="success"
      tone="#22c55e"
      placeholder="e.g. Appeal upheld after ID check"
      @close="lifting = null"
      @submit="lift"
    />
  </AdminPanel>
</template>
