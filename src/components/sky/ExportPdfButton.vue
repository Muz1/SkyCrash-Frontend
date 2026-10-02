<script setup lang="ts">
import { ref } from 'vue'
import { FileDown } from '@lucide/vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import type { ReportDefinition } from '@/lib/pdfReport'

const props = defineProps<{
  // Returns null while the page's data hasn't loaded yet.
  build: () => ReportDefinition | null
}>()

const isExporting = ref(false)
const error = ref('')

async function exportPdf() {
  const report = props.build()
  if (!report) return
  error.value = ''
  isExporting.value = true
  try {
    const { exportReportPdf } = await import('@/lib/pdfReport')
    await exportReportPdf(report)
  } catch {
    error.value = 'Export failed.'
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="relative flex flex-col items-end">
    <AdminButton variant="secondary" :disabled="isExporting" @click="exportPdf">
      <FileDown aria-hidden="true" />
      {{ isExporting ? 'Exporting…' : 'Export PDF' }}
    </AdminButton>
    <p v-if="error" class="absolute top-full mt-1 whitespace-nowrap text-[13px] font-semibold text-[oklch(0.72_0.19_22)]">{{ error }}</p>
  </div>
</template>
