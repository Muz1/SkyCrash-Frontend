<script setup lang="ts">
import { ref } from 'vue'
import { FileDown } from '@lucide/vue'
import AdminButton from './AdminButton.vue'
import { PDF_IGNORE_ATTR } from '@/lib/pagePdf'

/** Exports the admin page it sits on (its closest .adm-page) as a PDF, exactly as shown. */
const props = defineProps<{ title: string }>()

const root = ref<HTMLElement | null>(null)
const busy = ref(false)
const error = ref('')

async function exportPage() {
  const page = root.value?.closest<HTMLElement>('.adm-page')
  if (!page || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const { exportElementPdf } = await import('@/lib/pagePdf')
    await exportElementPdf(page, props.title)
  } catch {
    error.value = 'Export failed.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div ref="root" class="relative flex flex-col items-end" v-bind="{ [PDF_IGNORE_ATTR]: '' }">
    <AdminButton variant="secondary" :disabled="busy" @click="exportPage">
      <FileDown aria-hidden="true" />
      {{ busy ? 'Exporting…' : 'Export PDF' }}
    </AdminButton>
    <p
      v-if="error"
      role="alert"
      class="absolute top-full mt-1 whitespace-nowrap text-[13px] font-semibold text-[oklch(0.72_0.19_22)]"
    >
      {{ error }}
    </p>
  </div>
</template>
