<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from './AdminPage.vue'
import AdminLoading from './AdminLoading.vue'
import ReportFilter from './ReportFilter.vue'
import AboutReport from './AboutReport.vue'
import type { ReportQuery } from '@/types/insights'
import type { AboutContent } from '@/lib/reportAbout'
import { admin as copy } from '@/copy/admin'

/**
 * The frame every report page shares: title, date-range filter, "About this report",
 * error state, and the previous data kept (dimmed) while a new range loads.
 */
withDefaults(defineProps<{
  title: string
  eyebrow: string
  subtitle: string
  about: AboutContent
  ready: boolean
  loading?: boolean
  error?: string | null
  info?: { from: string; to: string; days: number } | null
  /** Reports that aren't date-based (e.g. Skin Usage) hide the filter. */
  filter?: boolean
  /** Show the "Include test accounts" switch (analytics reports; adds ?includeTest=true). */
  testToggle?: boolean
  /** Turn off the page-snapshot PDF (pages with their own data export). */
  pageExport?: boolean
}>(), { filter: true, loading: false, error: null, info: null, testToggle: false, pageExport: true })
const query = defineModel<ReportQuery>('query')

function setIncludeTest(on: boolean) {
  if (!query.value) return
  const { includeTest: _drop, ...rest } = query.value
  void _drop
  query.value = on ? { ...rest, includeTest: true } : rest
}
</script>

<template>
  <AdminShell>
    <AdminPage :title="title" :eyebrow="eyebrow" :subtitle="subtitle" :page-export="pageExport">
      <template #actions>
        <slot name="actions" />
        <label v-if="testToggle && query" class="adm-switch" :title="copy.testToggle.hint">
          <input type="checkbox" :checked="!!query.includeTest" @change="setIncludeTest(($event.target as HTMLInputElement).checked)" />
          <span class="adm-switch-track" aria-hidden="true" />
          <span>{{ copy.testToggle.label }}</span>
        </label>
        <ReportFilter v-if="filter && query" v-model="query" :info="info" />
      </template>

      <AboutReport v-bind="about" />

      <p v-if="error" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>

      <div v-if="ready" class="adm-report" :class="{ 'is-loading': loading }" :aria-busy="loading">
        <slot />
      </div>
      <AdminLoading v-else-if="!error" text="Loading report…" />
    </AdminPage>
  </AdminShell>
</template>
