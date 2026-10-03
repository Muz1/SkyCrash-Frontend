<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Users, UserPlus, Activity, Repeat, UserMinus, Gauge, Plane, Info } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import { getPlayerRetention } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, pct, shortDate } from '@/lib/reportFormat'
import type { PlayerRetentionReport } from '@/types/retention'

// Retention is measured across all players as of now, so no date range.
const data = ref<PlayerRetentionReport | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await getPlayerRetention()
  } catch {
    error.value = 'Player retention could not be loaded. Please try again.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const lifecycle = computed(() => {
  const d = data.value
  if (!d) return []
  const total = Math.max(1, d.totalRegisteredPlayers)
  return [
    { label: 'New', n: d.newPlayers, color: 'var(--adm-chart-1)' },
    { label: 'Active', n: d.activePlayers, color: 'var(--neon-lime)' },
    { label: 'Returning', n: d.returningPlayers, color: 'oklch(0.72 0.15 200)' },
    { label: 'Long-term', n: d.longTermPlayers, color: 'oklch(0.62 0.2 300)' },
    { label: 'Inactive', n: d.inactivePlayers, color: 'oklch(0.7 0.02 260)' },
  ].map((s) => ({ ...s, value: (100 * s.n) / total }))
})

/** Shades a cohort cell by its retention percentage. */
function cellStyle(p: number | null) {
  if (p === null) return {}
  const strength = Math.round(12 + (Math.min(100, p) / 100) * 68)
  return { background: `color-mix(in oklab, var(--adm-chart-1) ${strength}%, transparent)`, color: p >= 55 ? 'white' : undefined }
}

function diff(a: number | null, b: number | null) {
  if (a === null || b === null) return null
  return Math.round((a - b) * 10) / 10
}
</script>

<template>
  <ReportLayout
    title="Player Retention"
    eyebrow="Game analytics"
    subtitle="Do players come back after their first flight, and what do returning players do?"
    :about="ABOUT.retention!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :filter="false"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Registered players" :icon="Users" tone="blue" :caption="`${count(data.neverPlayed)} haven't played yet`">
          <span class="adm-num">{{ count(data.totalRegisteredPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="New players" :icon="UserPlus" tone="lime" caption="First active in the last 7 days">
          <span class="adm-num">{{ count(data.newPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Active players" :icon="Activity" tone="lime" caption="Active on 3+ of the last 7 days">
          <span class="adm-num">{{ count(data.activePlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Returning players" :icon="Repeat" tone="violet" :caption="`Plus ${count(data.longTermPlayers)} long-term`">
          <span class="adm-num">{{ count(data.returningPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Recently inactive" :icon="UserMinus" tone="ember" caption="Last active 14–29 days ago">
          <span class="adm-num">{{ count(data.recentlyInactivePlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Avg sessions / player" :icon="Gauge" tone="blue" :caption="`${data.averageDaysPlayed} days played on average`">
          <span class="adm-num">{{ data.averageSessionsPerPlayer }}</span>
        </AdminKpi>
        <AdminKpi label="Avg flights / player" :icon="Plane" tone="magenta" :caption="`${count(data.totals.flights)} flights in total`">
          <span class="adm-num">{{ data.averageFlightsPerPlayer }}</span>
        </AdminKpi>
      </div>

      <div class="adm-grid-2">
        <AdminPanel title="Retention" caption="Players active again after their first session" accent="blue">
          <AdminBarChart
            label="Retention by window"
            value-label="Retained"
            :items="data.windows.map((w) => ({ label: w.label, value: w.percentage ?? 0, detail: w.percentage === null ? 'Not enough time yet' : `${w.retainedPlayers} of ${w.eligiblePlayers} players` }))"
            :format="(v) => `${v}%`"
            :height="200"
          />
          <table class="adm-table adm-table--dense mt-3">
            <caption class="sr-only">Retention results</caption>
            <thead>
              <tr><th scope="col">Retention</th><th scope="col">Counts as back on</th><th scope="col" class="text-right">Players</th><th scope="col" class="text-right">Result</th></tr>
            </thead>
            <tbody>
              <tr v-for="w in data.windows" :key="w.day">
                <th scope="row">{{ w.label }}</th>
                <td>{{ w.fromDay === w.toDay ? `day ${w.fromDay}` : `days ${w.fromDay}–${w.toDay}` }}</td>
                <td class="text-right">{{ w.eligiblePlayers ? `${count(w.retainedPlayers)} / ${count(w.eligiblePlayers)}` : '—' }}</td>
                <td class="text-right font-bold">{{ w.percentage === null ? 'Too early' : pct(w.percentage) }}</td>
              </tr>
            </tbody>
          </table>
        </AdminPanel>

        <AdminPanel title="Where players are now" caption="Lifecycle of every registered player" accent="lime">
          <div class="adm-split" role="img" :aria-label="lifecycle.map((s) => `${s.label} ${s.n}`).join(', ')">
            <span v-for="s in lifecycle" :key="s.label" :style="{ width: `${s.value}%`, background: s.color }" />
          </div>
          <div class="adm-split-legend">
            <span v-for="s in lifecycle" :key="s.label" class="inline-flex items-center gap-2">
              <span class="h-3 w-3 rounded-full" :style="{ background: s.color }" aria-hidden="true" />
              {{ s.label }} <b>{{ count(s.n) }}</b>
            </span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt class="adm-label">Sessions</dt><dd class="text-lg font-bold">{{ count(data.totals.sessions) }}</dd></div>
            <div><dt class="adm-label">Return sessions</dt><dd class="text-lg font-bold">{{ count(data.totals.returnSessions) }}</dd></div>
            <div><dt class="adm-label">Completed rounds</dt><dd class="text-lg font-bold">{{ count(data.totals.completedRounds) }}</dd></div>
            <div><dt class="adm-label">Cash-outs</dt><dd class="text-lg font-bold">{{ count(data.totals.cashOuts) }}</dd></div>
            <div><dt class="adm-label">Multiplayer rounds</dt><dd class="text-lg font-bold">{{ count(data.totals.multiplayerRounds) }}</dd></div>
            <div>
              <dt class="adm-label">Logins recorded</dt>
              <dd class="text-lg font-bold">{{ count(data.totals.loginsRecorded) }}</dd>
              <dd v-if="data.totals.loginTrackingSince" class="text-xs opacity-70">since {{ shortDate(data.totals.loginTrackingSince) }}</dd>
            </div>
          </dl>
        </AdminPanel>
      </div>

      <AdminPanel title="Cohorts" caption="Players grouped by the week of their first session (UTC, Monday–Sunday)" accent="violet">
        <div v-if="!data.cohorts.length" class="adm-empty">No player activity yet.</div>
        <div v-else class="adm-table-wrap">
          <table class="adm-table adm-table--dense">
            <caption class="sr-only">Retention by weekly cohort</caption>
            <thead>
              <tr>
                <th scope="col">Cohort</th>
                <th scope="col" class="text-right">Players</th>
                <th v-for="w in data.windows" :key="w.day" scope="col" class="text-center">{{ w.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.cohorts" :key="c.startDate">
                <th scope="row" class="whitespace-nowrap">{{ c.label }}</th>
                <td class="text-right">{{ count(c.players) }}</td>
                <td
                  v-for="w in c.windows"
                  :key="w.day"
                  class="text-center font-semibold"
                  :style="cellStyle(w.percentage)"
                  :title="w.percentage === null ? 'Too early to tell' : `${w.retainedPlayers} of ${w.eligiblePlayers} players`"
                >
                  {{ w.percentage === null ? '·' : pct(w.percentage) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Feature engagement"
        caption="Players who used each feature vs. those who didn't. Observed relationships only, not causes."
        accent="magenta"
        flush
      >
        <div class="adm-table-wrap">
          <table class="adm-table adm-table--dense">
            <caption class="sr-only">Feature engagement compared with return behaviour</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" class="text-right">Used it</th>
                <th scope="col" class="text-right">Return rate<br /><span class="font-normal">used · didn't</span></th>
                <th scope="col" class="text-right">Day 7<br /><span class="font-normal">used · didn't</span></th>
                <th scope="col" class="text-right">Avg sessions<br /><span class="font-normal">used · didn't</span></th>
                <th scope="col" class="text-right">Avg flights<br /><span class="font-normal">used · didn't</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in data.features" :key="f.key">
                <th scope="row">
                  {{ f.label }}
                  <span v-if="f.trackedSince" class="block text-xs font-normal opacity-70">tracked since {{ shortDate(f.trackedSince) }}</span>
                </th>
                <td class="text-right">{{ count(f.users) }} <span class="opacity-60">/ {{ count(f.users + f.nonUsers) }}</span></td>
                <td class="text-right">
                  <b>{{ pct(f.usersReturnRate) }}</b> · {{ pct(f.nonUsersReturnRate) }}
                  <span v-if="diff(f.usersReturnRate, f.nonUsersReturnRate) !== null" class="block text-xs opacity-70">
                    {{ diff(f.usersReturnRate, f.nonUsersReturnRate)! > 0 ? '+' : '' }}{{ diff(f.usersReturnRate, f.nonUsersReturnRate) }} pts
                  </span>
                </td>
                <td class="text-right"><b>{{ pct(f.usersDay7) }}</b> · {{ pct(f.nonUsersDay7) }}</td>
                <td class="text-right"><b>{{ f.usersAvgSessions }}</b> · {{ f.nonUsersAvgSessions }}</td>
                <td class="text-right"><b>{{ f.usersAvgFlights }}</b> · {{ f.nonUsersAvgFlights }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div class="adm-grid-2">
        <AdminPanel title="Feedback and coming back" caption="Do players who send feedback play again afterwards?" accent="ember">
          <div v-if="!data.feedback.submitters" class="adm-empty">No feedback submitted yet.</div>
          <dl v-else class="grid grid-cols-2 gap-4 text-sm">
            <div><dt class="adm-label">Players who sent feedback</dt><dd class="text-2xl font-bold">{{ count(data.feedback.submitters) }}</dd></div>
            <div>
              <dt class="adm-label">Played again afterwards</dt>
              <dd class="text-2xl font-bold">{{ pct(data.feedback.returnedAfterPercentage) }}</dd>
              <dd class="text-xs opacity-70">{{ count(data.feedback.returnedAfter) }} players, on a later day</dd>
            </div>
            <div><dt class="adm-label">Avg sessions after feedback</dt><dd class="text-2xl font-bold">{{ data.feedback.averageSessionsAfter }}</dd></div>
            <div>
              <dt class="adm-label">Return rate of non-submitters</dt>
              <dd class="text-2xl font-bold">{{ pct(data.feedback.nonSubmitterReturnRate) }}</dd>
              <dd class="text-xs opacity-70">for comparison, not a cause</dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="About the data" caption="What is and isn't measured yet" accent="blue">
          <ul class="space-y-2 text-sm">
            <li v-for="note in data.dataNotes" :key="note" class="flex gap-2">
              <Info class="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
              <span>{{ note }}</span>
            </li>
          </ul>
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
