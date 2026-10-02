<script setup lang="ts">
import { computed, ref } from 'vue'
import { Table2, ChartLine } from '@lucide/vue'

/**
 * Daily trend line(s) on ONE shared axis (never dual-axis): pass only series in
 * the same unit (e.g. bets and payouts, both credits). 2px lines, hairline
 * grid, a crosshair + tooltip per day on hover/focus, the latest value labelled
 * directly, a legend when there are two series, and a table view.
 */
interface Series {
  name: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    dates: string[]
    series: Series[]
    format?: (v: number) => string
    height?: number
  }>(),
  { height: 200, format: (v: number) => v.toLocaleString() },
)

const showTable = ref(false)
const active = ref<number | null>(null)

const all = computed(() => props.series.flatMap((s) => s.values))
const max = computed(() => Math.max(0, ...all.value))
const min = computed(() => Math.min(0, ...all.value))

// A "nice" round number at or above v, so gridlines land on round values.
function nice(v: number) {
  if (v <= 0) return 0
  const exp = 10 ** Math.floor(Math.log10(v))
  const n = v / exp
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * exp
}
// Values below zero (e.g. a loss-making day) extend the axis down past a zero line.
const ceiling = computed(() => nice(max.value) || (min.value < 0 ? 0 : 1))
const floor = computed(() => -nice(-min.value))
const span = computed(() => ceiling.value - floor.value || 1)
const ticks = computed(() =>
  floor.value < 0 ? [floor.value, 0, ceiling.value].filter((t, i, a) => a.indexOf(t) === i) : [0, ceiling.value / 2, ceiling.value],
)
const n = computed(() => props.dates.length)
const isEmpty = computed(() => all.value.every((v) => v === 0))

// x/y in a 0–100 space; the SVG stretches, strokes don't (non-scaling-stroke).
const x = (i: number) => (n.value <= 1 ? 50 : (i / (n.value - 1)) * 100)
const y = (v: number) => 100 - ((v - floor.value) / span.value) * 100
const tickPos = (t: number) => `${((t - floor.value) / span.value) * 100}%`

const paths = computed(() =>
  props.series.map((s, si) => ({
    name: s.name,
    tone: si + 1,
    points: s.values.map((v, i) => `${x(i)},${y(v)}`).join(' '),
    last: { left: x(s.values.length - 1), top: y(s.values[s.values.length - 1] ?? 0), value: s.values[s.values.length - 1] ?? 0 },
  })),
)

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

// Show ~6 date labels whatever the window length.
const xLabels = computed(() => {
  const step = Math.max(1, Math.ceil(n.value / 6))
  return props.dates.map((d, i) => ({ i, text: i % step === 0 || i === n.value - 1 ? shortDate(d) : '' }))
})
</script>

<template>
  <figure class="adm-chart">
    <div class="adm-chart-tools">
      <ul v-if="series.length > 1" class="adm-legend" aria-label="Legend">
        <li v-for="(s, i) in series" :key="s.name">
          <span class="adm-legend-swatch" :style="{ background: `var(--adm-chart-${i + 1})` }" aria-hidden="true" />
          {{ s.name }}
        </li>
      </ul>
      <button type="button" class="adm-chart-toggle" :aria-pressed="showTable" @click="showTable = !showTable">
        <component :is="showTable ? ChartLine : Table2" aria-hidden="true" />
        {{ showTable ? 'Chart' : 'Table' }}
      </button>
    </div>

    <div v-if="showTable" class="adm-table-wrap max-h-[260px]">
      <table class="adm-table adm-table--dense">
        <caption class="sr-only">{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th v-for="s in series" :key="s.name" scope="col" class="adm-num">{{ s.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(d, i) in dates" :key="d">
            <th scope="row" class="adm-num-inline">{{ shortDate(d) }}</th>
            <td v-for="s in series" :key="s.name" class="adm-num">{{ format(s.values[i] ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="isEmpty" class="adm-chart-empty">No activity in this period yet.</p>

    <template v-else>
      <div class="adm-trend" :style="{ height: `${height}px` }">
        <div class="adm-vchart-grid" aria-hidden="true">
          <div v-for="t in ticks" :key="t" class="adm-vchart-tick" :style="{ bottom: tickPos(t) }">
            <span>{{ format(t) }}</span>
          </div>
        </div>
        <div class="adm-trend-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              v-for="p in paths"
              :key="p.name"
              :points="p.points"
              fill="none"
              :stroke="`var(--adm-chart-${p.tone})`"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
            <line
              v-if="active !== null"
              :x1="x(active)"
              :x2="x(active)"
              y1="0"
              y2="100"
              class="adm-trend-crosshair"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <!-- markers live in HTML so they stay round on a stretched SVG -->
          <template v-for="p in paths" :key="`m-${p.name}`">
            <span
              v-if="active !== null"
              class="adm-trend-dot"
              :style="{
                left: `${x(active)}%`,
                top: `${y(series[p.tone - 1]?.values[active] ?? 0)}%`,
                background: `var(--adm-chart-${p.tone})`,
              }"
              aria-hidden="true"
            />
            <span
              v-else
              class="adm-trend-end adm-num"
              :style="{ left: `${p.last.left}%`, top: `${p.last.top}%` }"
              aria-hidden="true"
            >
              {{ format(p.last.value) }}
            </span>
          </template>
          <div class="adm-trend-hits" role="list" :aria-label="label">
            <div
              v-for="(d, i) in dates"
              :key="d"
              role="listitem"
              tabindex="0"
              class="adm-trend-hit"
              :aria-label="`${shortDate(d)}: ${series.map((s) => `${s.name} ${format(s.values[i] ?? 0)}`).join(', ')}`"
              @mouseenter="active = i"
              @mouseleave="active = null"
              @focus="active = i"
              @blur="active = null"
            />
          </div>
          <div
            v-if="active !== null"
            class="adm-tooltip adm-tooltip--trend"
            :class="{ 'is-flipped': x(active) > 60 }"
            :style="{ left: `${x(active)}%` }"
            role="presentation"
          >
            <strong>{{ shortDate(dates[active] ?? '') }}</strong>
            <span v-for="(s, si) in series" :key="s.name" class="adm-tooltip-row">
              <span class="adm-legend-swatch" :style="{ background: `var(--adm-chart-${si + 1})` }" aria-hidden="true" />
              {{ s.name }} <b class="adm-num">{{ format(s.values[active] ?? 0) }}</b>
            </span>
          </div>
        </div>
      </div>
      <div class="adm-trend-xlabels" aria-hidden="true">
        <span v-for="l in xLabels" :key="l.i" :style="{ left: `${x(l.i)}%` }">{{ l.text }}</span>
      </div>
    </template>
    <figcaption class="sr-only">{{ label }}</figcaption>
  </figure>
</template>
