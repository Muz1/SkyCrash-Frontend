<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search } from '@lucide/vue'
import AdminPanel from '../AdminPanel.vue'
import { getAuditLog } from '@/services/adminRulesService'
import { dateTime } from '@/lib/reportFormat'
import type { AuditLogEntry } from '@/types/admin'

/** Append-only: every sanction, lift, rule edit and appeal decision. */
const rows = ref<AuditLogEntry[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? rows.value.filter((r) => `${r.action} ${r.actor} ${r.ruleCode ?? ''} ${r.details}`.toLowerCase().includes(q)) : rows.value
})

onMounted(async () => {
  loading.value = true
  try {
    rows.value = await getAuditLog(300)
  } catch {
    error.value = 'The audit log could not be loaded.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminPanel title="Audit log" :caption="`Latest ${rows.length} entries · append-only`" accent="violet" flush>
    <template #toolbar>
      <div class="adm-toolbar">
        <div class="adm-search min-w-0 flex-1">
          <Search aria-hidden="true" />
          <input v-model="search" type="search" class="adm-input" placeholder="Filter by action, admin, rule or text…" aria-label="Filter audit log" />
        </div>
      </div>
    </template>
    <p v-if="error" class="adm-error mx-4 my-3" role="alert">{{ error }}</p>
    <div class="adm-table-wrap">
      <table class="adm-table adm-table--cards min-w-[50rem]">
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>By</th>
            <th>Rule</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in shown" :key="e.id">
            <td class="adm-num-inline" data-label="When">{{ dateTime(e.createdAtUtc) }}</td>
            <td class="adm-mono" data-label="Action">{{ e.action }}</td>
            <td data-label="By">{{ e.actor }}</td>
            <td class="adm-mono" data-label="Rule">{{ e.ruleCode ?? '—' }}</td>
            <td class="whitespace-normal" data-label="Details">{{ e.details }}</td>
          </tr>
          <tr v-if="!shown.length">
            <td colspan="5" class="adm-empty">{{ loading ? 'Loading…' : 'No entries.' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminPanel>
</template>
