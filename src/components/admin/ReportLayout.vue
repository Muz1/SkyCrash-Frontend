<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from './AdminPage.vue'
import AdminLoading from './AdminLoading.vue'
import ReportFilter from './ReportFilter.vue'
import AboutReport from './AboutReport.vue'
import type { ReportQuery } from '@/types/insights'
import type { AboutContent } from '@/lib/reportAbout'

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
}>(), { filter: true, loading: false, error: null, info: null })
const query = defineModel<ReportQuery>('query')
</script>

<template>
  <AdminShell>
    <AdminPage :title="title" :eyebrow="eyebrow" :subtitle="subtitle">
      <template #actions>
        <slot name="actions" />
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
