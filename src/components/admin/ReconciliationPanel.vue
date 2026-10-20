<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { RefreshCw } from '@lucide/vue'
import AdminPanel from './AdminPanel.vue'
import AdminButton from './AdminButton.vue'
import { getReconciliation } from '@/services/adminOpsService'
import type { ReconciliationReport } from '@/types/admin'
import { count, dateTime } from '@/lib/reportFormat'
import { admin as copy } from '@/copy/admin'

/** "Do the books balance?" One pass/fail badge per check, with the first offenders listed. */
const report = ref<ReconciliationReport | null>(null)
const loading = ref(false)
const error = ref('')

async function run() {
  loading.value = true
  error.value = ''
  try {
    report.value = await getReconciliation()
  } catch (err) {
    error.value =
      (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ??
      'The reconciliation could not run. Check the API is up.'
  } finally {
    loading.value = false
  }
}

onMounted(run)

const label = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

defineExpose({ report })
</script>

<template>
  <AdminPanel :title="copy.revenue.reconciliation.title" :caption="copy.revenue.reconciliation.caption" accent="lime">
    <template #actions>
      <span v-if="report" :class="['adm-badge', report.passed ? 'adm-badge--ok' : 'adm-badge--bad']">
        {{ report.passed ? 'All checks pass' : 'Issues found' }}
      </span>
      <AdminButton size="sm" :disabled="loading" @click="run">
        <RefreshCw aria-hidden="true" />
        {{ loading ? 'Checking…' : report ? copy.revenue.reconciliation.rerun : copy.revenue.reconciliation.run }}
      </AdminButton>
    </template>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
    <p v-if="report && (report.checkedAtUtc || report.betsChecked != null)" class="adm-subline mb-2">
      <template v-if="report.checkedAtUtc">Checked {{ dateTime(report.checkedAtUtc) }}</template>
      <template v-if="report.playersChecked != null"> · {{ count(report.playersChecked) }} players</template>
      <template v-if="report.betsChecked != null"> · {{ count(report.betsChecked) }} bets</template>
    </p>
    <ul v-if="report" class="adm-checks">
      <li v-for="c in report.checks" :key="c.key">
        <div class="adm-check-head">
          <span :class="['adm-badge', c.issueCount === 0 ? 'adm-badge--ok' : 'adm-badge--bad']">
            {{ c.issueCount === 0 ? 'Pass' : `Fail · ${count(c.issueCount)}` }}
          </span>
          <p>
            <strong>{{ label(c.key) }}</strong>
            <span class="adm-subline block">{{ c.description }}</span>
          </p>
        </div>
        <ul v-if="c.issues.length" class="adm-issues">
          <li v-for="(issue, i) in c.issues" :key="i">
            <strong v-if="issue.username">{{ issue.username }}: </strong>{{ issue.detail }}
            <span v-if="issue.betId" class="adm-mono adm-subline"> (bet {{ issue.betId.slice(0, 8) }})</span>
          </li>
          <li v-if="c.issueCount > c.issues.length" class="adm-subline">…and {{ count(c.issueCount - c.issues.length) }} more</li>
        </ul>
      </li>
    </ul>
    <p v-else-if="loading" class="adm-note">Running checks…</p>
  </AdminPanel>
</template>
