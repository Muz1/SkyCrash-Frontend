<script setup lang="ts">
import { ref } from 'vue'
import { FileDown } from '@lucide/vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
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
  <div class="flex flex-col items-end gap-1">
    <ArcadeButton size="sm" variant="ghost" :disabled="isExporting" @click="exportPdf">
      <FileDown class="h-3 w-3" aria-hidden="true" />
      {{ isExporting ? 'Exporting…' : 'Export PDF' }}
    </ArcadeButton>
    <p v-if="error" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-danger">{{ error }}</p>
  </div>
</template>
