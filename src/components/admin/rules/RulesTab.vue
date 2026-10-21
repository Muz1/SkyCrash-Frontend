<script setup lang="ts">
import { ref } from 'vue'
import { FileDown, FileText, Sheet, Pencil } from '@lucide/vue'
import AdminPanel from '../AdminPanel.vue'
import AdminButton from '../AdminButton.vue'
import AdminPill from '../AdminPill.vue'
import AdminInfo from '../AdminInfo.vue'
import RuleEditDialog from './RuleEditDialog.vue'
import { fetchFile } from '@/services/adminRulesService'
import { saveBlob } from '@/lib/adminDownload'
import { actionLabel, buildRulesReport, durationLabel, rulesCoverLine } from '@/lib/rulesReport'
import { dateTime } from '@/lib/reportFormat'
import type { AccountRule, RuleSet, RuleSetVersionSummary } from '@/types/admin'

const props = defineProps<{ current: RuleSet; history: RuleSetVersionSummary[] }>()
const emit = defineEmits<{ published: [set: RuleSet] }>()

const editing = ref<AccountRule | null>(null)
const busy = ref<'' | 'pdf' | 'md' | 'csv'>('')
const notice = ref('')
const error = ref('')

async function download(kind: 'pdf' | 'md' | 'csv') {
  busy.value = kind
  error.value = ''
  try {
    if (kind === 'pdf') {
      const { exportReportPdf } = await import('@/lib/pdfReport')
      await exportReportPdf(buildRulesReport(props.current))
    } else {
      const blob = await fetchFile(kind === 'md' ? '/rules/export.md' : '/rules/export.csv', { version: props.current.version })
      saveBlob(blob, `skycrash-rules-${props.current.label}.${kind}`)
    }
  } catch {
    error.value = 'Download failed. Check the API is running.'
  } finally {
    busy.value = ''
  }
}

function onPublished(set: RuleSet) {
  editing.value = null
  notice.value = `Published ${set.label}. Players accept it before their next bet.`
  emit('published', set)
}

const actionTone = (a: string) =>
  a === 'PermanentBlock' ? 'danger' : a === 'TemporaryBlock' || a === 'Escalating' ? 'warning' : a === 'Restriction' ? 'info' : 'neutral'
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPanel :title="rulesCoverLine(current)" :caption="`Published by ${current.publishedBy || 'system'}${current.changeNote ? ` · “${current.changeNote}”` : ''}`" accent="magenta">
      <template #actions>
        <AdminButton size="sm" :disabled="!!busy" @click="download('pdf')"><FileDown aria-hidden="true" />{{ busy === 'pdf' ? 'Building…' : 'PDF' }}</AdminButton>
        <AdminButton size="sm" :disabled="!!busy" @click="download('md')"><FileText aria-hidden="true" />Markdown</AdminButton>
        <AdminButton size="sm" :disabled="!!busy" @click="download('csv')"><Sheet aria-hidden="true" />CSV</AdminButton>
      </template>
      <p v-if="notice" class="adm-success mb-3" role="status">{{ notice }}</p>
      <p v-if="error" class="adm-error mb-3" role="alert">{{ error }}</p>

      <div class="adm-table-wrap">
        <table class="adm-table adm-table--cards min-w-[56rem]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Rule</th>
              <th>Action</th>
              <th>Default</th>
              <th>Appeal</th>
              <th>Status</th>
              <th class="adm-num">Edit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in current.rules" :key="r.code">
              <td class="adm-strong adm-mono" data-label="Code">{{ r.code }}</td>
              <td data-label="Rule" class="whitespace-normal">
                <span class="block font-semibold text-[var(--adm-text)]">
                  {{ r.title }}
                  <AdminInfo :term="r.title" :text="r.details" />
                </span>
                <span class="adm-subline block">{{ r.summary }}</span>
              </td>
              <td data-label="Action"><AdminPill :label="actionLabel(r.action)" :tone="actionTone(r.action)" :dot="false" /></td>
              <td data-label="Default" class="adm-num-inline">{{ durationLabel(r.defaultDurationDays) }}</td>
              <td data-label="Appeal">{{ r.appealable ? 'Yes' : 'No' }}</td>
              <td data-label="Status"><AdminPill :label="r.isActive ? 'Active' : 'Off'" :tone="r.isActive ? 'success' : 'neutral'" /></td>
              <td class="adm-actions">
                <div>
                  <AdminButton size="sm" variant="secondary" :aria-label="`Edit rule ${r.code}`" @click="editing = r">
                    <Pencil aria-hidden="true" /> Edit
                  </AdminButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminPanel>

    <AdminPanel title="Version history" :caption="`${history.length} versions`" accent="violet">
      <ol class="adm-checks">
        <li v-for="h in history" :key="h.version">
          <div class="adm-check-head">
            <span :class="['adm-badge', h.version === current.version ? 'adm-badge--ok' : '']">{{ h.label }}</span>
            <p>
              {{ h.changeNote || 'Initial rules' }}
              <span class="adm-subline block">{{ dateTime(h.effectiveFromUtc) }} · {{ h.publishedBy || 'system' }}</span>
            </p>
          </div>
        </li>
      </ol>
    </AdminPanel>

    <RuleEditDialog v-if="editing" :rule="editing" :version="current.label" @close="editing = null" @published="onPublished" />
  </div>
</template>
