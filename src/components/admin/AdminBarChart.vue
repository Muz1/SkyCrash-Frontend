<script setup lang="ts">
import { computed, ref } from 'vue'
import { Table2, ChartColumn } from '@lucide/vue'

/**
 * Single-series bar chart for the admin Analytics suite (crash histogram,
 * session lengths, ratings, tags, keywords). One colour for every bar (the
 * categories are already labelled), hairline grid, values on hover/focus and
 * on the tallest bar, plus a table view so no value is gated behind a tooltip.
 */
const props = withDefaults(
  defineProps<{
    items: { label: string; value: number; detail?: string }[]
    /** Accessible name of the chart, also the table caption. */
    label: string
    valueLabel?: string
    format?: (v: number) => string
    horizontal?: boolean
    /** Plot height in px (vertical charts). */
    height?: number
    tone?: 1 | 2
    emptyText?: string
  }>(),
  { valueLabel: 'Value', horizontal: false, height: 200, tone: 1, format: (v: number) => v.toLocaleString() },
)

const showTable = ref(false)
const active = ref<number | null>(null)

const max = computed(() => Math.max(0, ...props.items.map((i) => i.value)))
// A "nice" ceiling so gridlines land on round numbers.
const ceiling = computed(() => {
  if (max.value <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(max.value))
  const n = max.value / exp
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return nice * exp
})
const ticks = computed(() => [0, 0.5, 1].map((k) => ceiling.value * k))
const peakIndex = computed(() => props.items.findIndex((i) => i.value === max.value && max.value > 0))
const isEmpty = computed(() => props.items.every((i) => i.value === 0))

function pct(v: number) {
  return `${(v / ceiling.value) * 100}%`
}
</script>

<template>
  <figure class="adm-chart" :style="{ '--adm-series': `var(--adm-chart-${tone})` }">
    <div class="adm-chart-tools">
      <button
        type="button"
        class="adm-chart-toggle"
        :aria-pressed="showTable"
        @click="showTable = !showTable"
      >
        <component :is="showTable ? ChartColumn : Table2" aria-hidden="true" />
        {{ showTable ? 'Chart' : 'Table' }}
      </button>
    </div>

    <table v-if="showTable" class="adm-table adm-table--dense">
      <caption class="sr-only">{{ label }}</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col" class="adm-num">{{ valueLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.label">
          <th scope="row" class="adm-strong">{{ item.label }}</th>
          <td class="adm-num">{{ format(item.value) }}<span v-if="item.detail" class="adm-muted"> · {{ item.detail }}</span></td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="isEmpty" class="adm-chart-empty">{{ emptyText ?? 'No data in this period yet.' }}</p>

    <!-- Horizontal: long category names (keywords, tags) read left-to-right. -->
    <ul v-else-if="horizontal" class="adm-hbars" role="list" :aria-label="label">
      <li v-for="(item, i) in items" :key="item.label" class="adm-hbar-row">
        <span class="adm-hbar-label">{{ item.label }}</span>
        <span class="adm-hbar-track">
          <span class="adm-hbar-fill" :style="{ width: pct(item.value) }" />
        </span>
        <span class="adm-hbar-value adm-num">
          {{ format(item.value) }}<span v-if="item.detail" class="adm-muted"> · {{ item.detail }}</span>
        </span>
        <span class="sr-only">{{ i === peakIndex ? '(highest)' : '' }}</span>
      </li>
    </ul>

    <div v-else class="adm-vchart" :style="{ height: `${height}px` }">
      <div class="adm-vchart-grid" aria-hidden="true">
        <div v-for="t in ticks" :key="t" class="adm-vchart-tick" :style="{ bottom: pct(t) }">
          <span>{{ format(t) }}</span>
        </div>
      </div>
      <div class="adm-vchart-bars" role="list" :aria-label="label">
        <div
          v-for="(item, i) in items"
          :key="item.label"
          role="listitem"
          tabindex="0"
          class="adm-vchart-col"
          :aria-label="`${item.label}: ${format(item.value)}${item.detail ? `, ${item.detail}` : ''}`"
          @mouseenter="active = i"
          @mouseleave="active = null"
          @focus="active = i"
          @blur="active = null"
        >
          <span class="adm-vchart-bar" :class="{ 'is-active': active === i }" :style="{ height: pct(item.value) }">
            <span v-if="i === peakIndex && active === null" class="adm-vchart-peak adm-num" aria-hidden="true">
              {{ format(item.value) }}
            </span>
          </span>
          <span v-if="active === i" class="adm-tooltip" role="presentation">
            <strong>{{ item.label }}</strong>
            <span class="adm-num">{{ format(item.value) }}</span>
            <span v-if="item.detail">{{ item.detail }}</span>
          </span>
        </div>
      </div>
    </div>
    <div v-if="!showTable && !horizontal && !isEmpty" class="adm-vchart-xlabels" aria-hidden="true">
      <span v-for="item in items" :key="item.label">{{ item.label }}</span>
    </div>
    <figcaption class="sr-only">{{ label }}</figcaption>
  </figure>
</template>
