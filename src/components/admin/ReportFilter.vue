<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays } from '@lucide/vue'
import type { RangePreset, ReportQuery } from '@/types/insights'

/** Today / This week / This month / Custom range. Shared by every report (see useReport). */
const model = defineModel<ReportQuery>({ required: true })
defineProps<{ info?: { from: string; to: string; days: number } | null }>()

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
]

const today = new Date().toISOString().slice(0, 10)
const from = ref(model.value.from ?? new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10))
const to = ref(model.value.to ?? today)

function pick(id: RangePreset) {
  model.value = id === 'custom' ? { range: 'custom', from: from.value, to: to.value } : { range: id }
}

watch([from, to], () => {
  if (model.value.range === 'custom' && from.value && to.value) {
    model.value = { range: 'custom', from: from.value, to: to.value }
  }
})

const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const isCustom = computed(() => model.value.range === 'custom')
</script>

<template>
  <div class="adm-filter">
    <div class="adm-segmented" role="group" aria-label="Report date range">
      <button v-for="p in PRESETS" :key="p.id" type="button" :aria-pressed="model.range === p.id" @click="pick(p.id)">
        {{ p.label }}
      </button>
    </div>
    <div v-if="isCustom" class="adm-filter-dates">
      <label>
        <span class="sr-only">From</span>
        <input v-model="from" type="date" class="adm-input" :max="to || today" aria-label="From date" />
      </label>
      <span aria-hidden="true">→</span>
      <label>
        <span class="sr-only">To</span>
        <input v-model="to" type="date" class="adm-input" :min="from" :max="today" aria-label="To date" />
      </label>
    </div>
    <p v-if="info" class="adm-filter-range">
      <CalendarDays aria-hidden="true" />
      {{ fmt(info.from) }}<template v-if="info.days > 1"> – {{ fmt(info.to) }}</template>
      <span>({{ info.days }} day{{ info.days === 1 ? '' : 's' }}, UTC)</span>
    </p>
  </div>
</template>
