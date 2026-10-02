<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import {
  Coins,
  HandCoins,
  TrendingUp,
  Landmark,
  Scale,
  Rocket,
  Percent,
  Target,
  MessageSquareHeart,
  Star,
  Smile,
  Gift,
  Users,
  Gauge,
  Activity,
  Timer,
  Sparkles,
  CircleCheck,
  CircleAlert,
} from '@lucide/vue'
import * as analyticsService from '@/services/adminAnalyticsService'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import AdminExplain from '@/components/admin/AdminExplain.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import type { AnalyticsOverview, FeedbackAnalytics, FeedbackSettings } from '@/types/insights'

type Section = 'financial' | 'feedback' | 'telemetry'

const RANGES = [7, 30, 90] as const
const days = ref<(typeof RANGES)[number]>(30)
const section = ref<Section>('financial')

const overview = ref<AnalyticsOverview | null>(null)
const feedback = ref<FeedbackAnalytics | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)

const settings = ref<FeedbackSettings | null>(null)
const settingsDraft = ref<FeedbackSettings>({ firstPromptAfterRounds: 3, promptIntervalRounds: 10, rewardCredits: 50 })
const settingsMessage = ref<{ ok: boolean; text: string } | null>(null)
const savingSettings = ref(false)

const credits = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })
const count = (v: number) => v.toLocaleString()
const pct = (v: number) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 1 })}`

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [o, f] = await Promise.all([
      analyticsService.getAnalyticsOverview(days.value),
      analyticsService.getFeedbackAnalytics(days.value),
    ])
    overview.value = o
    feedback.value = f
  } catch {
    loadError.value = 'Analytics could not be loaded. Check the API is running and try again.'
  } finally {
    loading.value = false
  }
}

async function loadSettings() {
  settings.value = await analyticsService.getFeedbackSettings()
  settingsDraft.value = { ...settings.value }
}

async function saveSettings() {
  savingSettings.value = true
  settingsMessage.value = null
  try {
    settings.value = await analyticsService.updateFeedbackSettings(settingsDraft.value)
    settingsDraft.value = { ...settings.value }
    settingsMessage.value = { ok: true, text: 'Feedback schedule saved. It applies from each player’s next round.' }
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
    settingsMessage.value = { ok: false, text: message ?? 'Could not save the feedback schedule.' }
  } finally {
    savingSettings.value = false
  }
}

const settingsDirty = computed(
  () =>
    !!settings.value &&
    (settings.value.firstPromptAfterRounds !== settingsDraft.value.firstPromptAfterRounds ||
      settings.value.promptIntervalRounds !== settingsDraft.value.promptIntervalRounds ||
      settings.value.rewardCredits !== settingsDraft.value.rewardCredits),
)

watch(days, load)
onMounted(() => {
  load()
  loadSettings()
})

// ---------- derived chart data ----------
const fin = computed(() => overview.value?.financial ?? null)
const game = computed(() => overview.value?.gameplay ?? null)
const ret = computed(() => overview.value?.retention ?? null)

const rtpDelta = computed(() => (fin.value ? fin.value.actualRtpPercentage - fin.value.theoreticalRtpPercentage : 0))

const sentimentTone = computed(() => {
  const s = feedback.value?.sentimentScore ?? 0
  return s > 15 ? 'Positive' : s < -15 ? 'Negative' : 'Neutral'
})

const SENTIMENT_PILL = { Positive: 'success', Negative: 'danger', Neutral: 'neutral', Mixed: 'warning' } as const

// ---------- metric definitions (the "what does this measure?" drop-downs) ----------
const EXPLAIN_FINANCIAL = [
  { term: 'Total Bets', definition: 'Sum of all stakes on bets that have resolved (cashed out or lost) in the selected window. Bets still riding on a live round are excluded until it ends.' },
  { term: 'Total Payouts', definition: 'Sum of credits paid back to players who cashed out before the crash (stake × cash-out multiplier).' },
  { term: 'GGR: Gross Gaming Revenue', definition: 'Total Bets − Total Payouts. What the house kept from play before any promotions.' },
  { term: 'NGR: Net Gaming Revenue', definition: 'GGR − bonuses. Bonuses are free credits given away: daily challenge rewards and feedback rewards. Purchases, demo top-ups and admin adjustments are not bonuses.' },
  { term: 'Average Bet Size', definition: 'Total Bets ÷ number of resolved bets.' },
  { term: 'Average Multiplier at Cash-out', definition: 'Mean cash-out multiplier across winning bets only. Higher means players are holding on longer before cashing out.' },
  { term: 'Cash-out Rate', definition: 'Share of resolved bets that cashed out before the crash (won), as a percentage.' },
  { term: 'RTP: Return to Player', definition: 'Total Payouts ÷ Total Bets × 100. Theoretical RTP is 100 − configured house edge; actual RTP drifts around it and converges over many bets.' },
  { term: 'Realised House Edge', definition: '100 − actual RTP for that timeframe: the share of stakes the house actually kept.' },
]
const EXPLAIN_FEEDBACK = [
  { term: 'Players who completed feedback', definition: 'Distinct players who submitted at least one feedback form in the window.' },
  { term: 'Average Rating', definition: 'Mean of the 1–5 star overall-experience rating across submissions.' },
  { term: 'Sentiment Score', definition: 'From −100 (all negative) to +100 (all positive). Each submission is scored mostly from its star rating (70%) and partly from positive/negative wording in its free text (30%), then averaged.' },
  { term: 'Credits Awarded', definition: 'Free credits paid out as feedback incentives (one reward per accepted submission). The all-time figure covers every period.' },
  { term: 'Area tags', definition: 'How often players tagged Gameplay, Graphics/UI, Sound or Performance, with the average star rating of those submissions: a low average flags the weakest area.' },
  { term: 'Keywords', definition: 'Most frequent meaningful words across both free-text answers (common filler words removed), counted once per submission.' },
  { term: 'Consolidated insights', definition: 'Free-text answers grouped into themes with a sentiment and a suggested action. Produced by Gemini when an API key is configured on the server, otherwise by the built-in keyword analyser.' },
]
const EXPLAIN_TELEMETRY = [
  { term: 'Crash Point Distribution', definition: 'How many rounds crashed within each multiplier band. Most rounds crash low by design; the long tail above 10x is what makes big wins possible.' },
  { term: 'Peak CCU: Concurrent Users', definition: 'The most players connected at the same moment, sampled every minute (admins excluded).' },
  { term: 'DAU: Daily Active Users', definition: 'Distinct players per calendar day (UTC) who opened the game or placed a bet. Average DAU is the mean across the window’s days.' },
  { term: 'Retention (Day 1 / 7 / 30)', definition: 'Of players who signed up in the window and are at least N days old, the share who came back on day N or any later day ("rolling" retention).' },
  { term: 'Session Length', definition: 'Time from a player’s first open connection to their last one closing. Sessions cut short by a server restart are left out.' },
]

function rangeLabel(d: number) {
  return `${d} days`
}
</script>

<template>
  <AdminShell
    help-text="Analytics covers money (GGR, NGR, RTP), player feedback and gameplay telemetry for the selected window. Open the 'What do these numbers mean?' panels for exact definitions. Every chart has a Table button for exact values."
  >
    <AdminPage title="Analytics" eyebrow="Insights" subtitle="Profitability, player feedback and gameplay telemetry.">
      <template #actions>
        <div class="adm-segmented" role="group" aria-label="Time window">
          <button v-for="d in RANGES" :key="d" type="button" :aria-pressed="days === d" @click="days = d">
            {{ rangeLabel(d) }}
          </button>
        </div>
      </template>

      <div class="adm-segmented self-start" role="group" aria-label="Report section">
        <button type="button" :aria-pressed="section === 'financial'" @click="section = 'financial'">Financial</button>
        <button type="button" :aria-pressed="section === 'feedback'" @click="section = 'feedback'">Feedback</button>
        <button type="button" :aria-pressed="section === 'telemetry'" @click="section = 'telemetry'">Gameplay telemetry</button>
      </div>

      <p v-if="loadError" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ loadError }}</p>

      <div
        v-if="overview && feedback"
        class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 transition-opacity [&>*]:shrink-0"
        :class="{ 'opacity-60': loading }"
        :aria-busy="loading"
      >
        <!-- ============ FINANCIAL ============ -->
        <template v-if="section === 'financial' && fin">
          <h2 class="adm-section-title"><Coins aria-hidden="true" />Financial &amp; profitability</h2>
          <AdminExplain :items="EXPLAIN_FINANCIAL" />

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminKpi label="Total Bets" :icon="Coins" tone="blue" :caption="`${plural(fin.betCount, 'resolved bet')}`">
              <span class="adm-num">{{ credits(fin.totalBets) }}</span>
            </AdminKpi>
            <AdminKpi label="Total Payouts" :icon="HandCoins" tone="ember" caption="Paid to players who cashed out">
              <span class="adm-num">{{ credits(fin.totalPayouts) }}</span>
            </AdminKpi>
            <AdminKpi label="GGR" :icon="TrendingUp" tone="lime" caption="Bets − payouts">
              <span class="adm-num">{{ credits(fin.ggr) }}</span>
            </AdminKpi>
            <AdminKpi label="NGR" :icon="Landmark" tone="violet" :caption="`GGR − ${credits(fin.bonuses)} in bonuses`">
              <span class="adm-num">{{ credits(fin.ngr) }}</span>
            </AdminKpi>
            <AdminKpi label="Average Bet Size" :icon="Scale" tone="blue">
              <span class="adm-num">{{ credits(fin.averageBet) }}</span>
            </AdminKpi>
            <AdminKpi label="Avg Multiplier at Cash-out" :icon="Rocket" tone="ember" :caption="`${pct(fin.cashoutRatePercentage)} of bets cashed out`">
              <span class="adm-num">{{ fin.averageCashoutMultiplier.toFixed(2) }}x</span>
            </AdminKpi>
            <AdminKpi label="Actual RTP" :icon="Percent" tone="lime" :caption="`${signed(rtpDelta)} pts vs ${pct(fin.theoreticalRtpPercentage)} theoretical`">
              <span class="adm-num">{{ pct(fin.actualRtpPercentage) }}</span>
            </AdminKpi>
            <AdminKpi label="Configured House Edge" :icon="Target" tone="magenta" caption="Set on the RTP & House Edge tab">
              <span class="adm-num">{{ pct(fin.houseEdgePercentage) }}</span>
            </AdminKpi>
          </div>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <AdminPanel title="Total Bets vs Total Payouts" caption="Per day, in credits. The gap between the lines is GGR." accent="blue">
              <AdminTrendChart
                label="Daily total bets versus total payouts in credits"
                :dates="fin.daily.map((d) => d.date)"
                :series="[
                  { name: 'Total Bets', values: fin.daily.map((d) => d.bets) },
                  { name: 'Total Payouts', values: fin.daily.map((d) => d.payouts) },
                ]"
                :format="credits"
              />
            </AdminPanel>

            <AdminPanel title="RTP & House Edge by Timeframe" caption="Actual figures from resolved bets" accent="ember" flush>
              <div class="adm-table-wrap">
                <table class="adm-table adm-table--dense">
                  <thead>
                    <tr>
                      <th>Timeframe</th>
                      <th class="adm-num">Bets</th>
                      <th class="adm-num">GGR</th>
                      <th class="adm-num">RTP</th>
                      <th class="adm-num">Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="w in fin.windows" :key="w.label">
                      <th scope="row" class="adm-strong">{{ w.label }}</th>
                      <td class="adm-num">{{ count(w.betCount) }}</td>
                      <td class="adm-num">{{ credits(w.ggr) }}</td>
                      <td class="adm-num adm-strong">{{ w.betCount ? pct(w.actualRtpPercentage) : '—' }}</td>
                      <td class="adm-num">{{ w.betCount ? pct(w.actualHouseEdgePercentage) : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <template #footer>
                <span>Theoretical: RTP {{ pct(fin.theoreticalRtpPercentage) }} · edge {{ pct(fin.houseEdgePercentage) }}</span>
              </template>
            </AdminPanel>
          </div>
        </template>

        <!-- ============ FEEDBACK ============ -->
        <template v-else-if="section === 'feedback'">
          <h2 class="adm-section-title"><MessageSquareHeart aria-hidden="true" />User feedback analytics</h2>
          <AdminExplain :items="EXPLAIN_FEEDBACK" />

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminKpi label="Players Who Gave Feedback" :icon="Users" tone="blue" :caption="plural(feedback.totalSubmissions, 'submission')">
              <span class="adm-num">{{ count(feedback.uniquePlayers) }}</span>
            </AdminKpi>
            <AdminKpi label="Average Rating" :icon="Star" tone="ember" caption="Out of 5 stars">
              <span class="adm-num">{{ feedback.totalSubmissions ? feedback.averageRating.toFixed(2) : '—' }}</span>
            </AdminKpi>
            <AdminKpi label="Sentiment Score" :icon="Smile" tone="lime">
              <span class="adm-num">{{ feedback.totalSubmissions ? signed(feedback.sentimentScore) : '—' }}</span>
              <template #caption>
                <span class="inline-flex items-center gap-2">
                  −100 to +100
                  <AdminPill v-if="feedback.totalSubmissions" :label="sentimentTone" :tone="SENTIMENT_PILL[sentimentTone]" />
                </span>
              </template>
            </AdminKpi>
            <AdminKpi label="Credits Awarded" :icon="Gift" tone="violet" :caption="`${credits(feedback.totalCreditsAwardedAllTime)} all time`">
              <span class="adm-num">{{ credits(feedback.totalCreditsAwarded) }}</span>
            </AdminKpi>
          </div>

          <AdminPanel title="Consolidated Insights" :caption="feedback.insights.summary" accent="magenta">
            <template #actions>
              <AdminPill
                :label="feedback.insights.source === 'gemini' ? 'Gemini summary' : 'Keyword analysis'"
                :tone="feedback.insights.source === 'gemini' ? 'info' : 'neutral'"
                :dot="false"
              />
            </template>
            <p v-if="feedback.insights.warning" class="adm-callout mb-3">
              <CircleAlert aria-hidden="true" />{{ feedback.insights.warning }}
            </p>
            <ul v-if="feedback.insights.clusters.length" class="grid gap-3 md:grid-cols-2">
              <li
                v-for="c in feedback.insights.clusters"
                :key="c.title"
                class="rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface-2)] p-4"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <Sparkles class="h-4 w-4 text-[var(--neon-magenta)]" aria-hidden="true" />
                  <h3 class="font-sans text-[15px] font-bold normal-case tracking-normal text-[var(--adm-text)]">{{ c.title }}</h3>
                  <AdminPill :label="c.sentiment" :tone="SENTIMENT_PILL[c.sentiment]" />
                  <span class="ml-auto text-[13.5px] text-[var(--adm-text-3)]">{{ c.mentions }} mention{{ c.mentions === 1 ? '' : 's' }}</span>
                </div>
                <p class="mt-2 text-[14.5px] leading-relaxed text-[var(--adm-text)]">
                  <strong class="font-bold">Action:</strong> {{ c.suggestion }}
                </p>
                <ul v-if="c.examples.length" class="mt-2 space-y-1">
                  <li v-for="ex in c.examples" :key="ex" class="border-l-2 border-[var(--adm-border-strong)] pl-3 text-[14px] italic leading-relaxed text-[var(--adm-text-2)]">
                    “{{ ex }}”
                  </li>
                </ul>
              </li>
            </ul>
            <p v-else class="adm-chart-empty">No written feedback to analyse in this period yet.</p>
          </AdminPanel>

          <div class="grid gap-4 xl:grid-cols-3">
            <AdminPanel title="Rating Distribution" caption="Submissions per star rating" accent="ember">
              <AdminBarChart
                label="Feedback submissions per star rating"
                value-label="Submissions"
                :items="feedback.ratingDistribution.map((r) => ({ label: r.label, value: r.count }))"
                :height="170"
                :tone="2"
              />
            </AdminPanel>
            <AdminPanel title="Areas Tagged" caption="Count · average rating" accent="blue">
              <AdminBarChart
                label="Feedback area tags with average rating"
                value-label="Submissions"
                horizontal
                :items="
                  feedback.tags.map((t) => ({
                    label: t.tag,
                    value: t.count,
                    detail: t.count ? `${t.averageRating.toFixed(1)}★` : undefined,
                  }))
                "
              />
            </AdminPanel>
            <AdminPanel title="Common Keywords" caption="From both free-text answers" accent="violet">
              <AdminBarChart
                label="Most common feedback keywords"
                value-label="Submissions mentioning it"
                horizontal
                :items="feedback.keywords.slice(0, 10).map((k) => ({ label: k.label, value: k.count }))"
              />
            </AdminPanel>
          </div>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
            <AdminPanel title="Recent Feedback" caption="Newest first" accent="lime" flush>
              <div class="adm-table-wrap max-h-[380px]">
                <table class="adm-table adm-table--dense min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th class="adm-num">Rating</th>
                      <th>Sentiment</th>
                      <th>Improve</th>
                      <th>Liked</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="f in feedback.recent" :key="f.feedbackId">
                      <td class="adm-strong">{{ f.username }}</td>
                      <td class="adm-num">{{ f.rating }}★</td>
                      <td><AdminPill :label="f.sentiment" :tone="SENTIMENT_PILL[f.sentiment]" /></td>
                      <td class="max-w-[260px] !whitespace-normal py-2 leading-snug">{{ f.improveText ?? '—' }}</td>
                      <td class="max-w-[260px] !whitespace-normal py-2 leading-snug">{{ f.likedText ?? '—' }}</td>
                      <td class="adm-muted adm-num-inline">{{ new Date(f.createdAtUtc).toLocaleDateString() }}</td>
                    </tr>
                    <tr v-if="feedback.recent.length === 0">
                      <td colspan="6" class="adm-empty">No feedback submitted in this period yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AdminPanel>

            <AdminPanel title="Feedback Prompt Schedule" caption="When players are asked and what they earn" accent="magenta">
              <form v-if="settings" class="flex flex-col gap-4" @submit.prevent="saveSettings">
                <label class="block">
                  <span class="adm-label">First prompt after (rounds played)</span>
                  <input v-model.number="settingsDraft.firstPromptAfterRounds" type="number" min="1" max="1000" class="adm-input adm-num w-full" />
                </label>
                <label class="block">
                  <span class="adm-label">Then every (rounds)</span>
                  <input v-model.number="settingsDraft.promptIntervalRounds" type="number" min="1" max="1000" class="adm-input adm-num w-full" />
                </label>
                <label class="block">
                  <span class="adm-label">Reward per submission (credits)</span>
                  <input v-model.number="settingsDraft.rewardCredits" type="number" min="0" max="10000" step="1" class="adm-input adm-num w-full" />
                </label>
                <p class="adm-note">
                  Players see the form after round {{ settingsDraft.firstPromptAfterRounds }}, then every
                  {{ settingsDraft.promptIntervalRounds }} rounds after they answer. “Not now” postpones it by one interval.
                </p>
                <div class="flex items-center gap-3">
                  <AdminButton type="submit" variant="primary" :disabled="!settingsDirty || savingSettings">
                    {{ savingSettings ? 'Saving…' : 'Save schedule' }}
                  </AdminButton>
                  <p v-if="settingsMessage" role="status" :class="settingsMessage.ok ? 'adm-success flex items-center gap-2' : 'adm-error'">
                    <CircleCheck v-if="settingsMessage.ok" class="h-4 w-4 shrink-0" aria-hidden="true" />
                    {{ settingsMessage.text }}
                  </p>
                </div>
              </form>
              <AdminLoading v-else />
            </AdminPanel>
          </div>
        </template>

        <!-- ============ TELEMETRY ============ -->
        <template v-else-if="section === 'telemetry' && game && ret">
          <h2 class="adm-section-title"><Activity aria-hidden="true" />Player gameplay telemetry</h2>
          <AdminExplain :items="EXPLAIN_TELEMETRY" />

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminKpi
              label="Peak CCU"
              :icon="Gauge"
              tone="magenta"
              :caption="game.peakConcurrentAtUtc ? `at ${new Date(game.peakConcurrentAtUtc).toLocaleString()}` : 'No samples yet'"
            >
              <span class="adm-num">{{ count(game.peakConcurrentPlayers) }}</span>
            </AdminKpi>
            <AdminKpi label="Online Now" :icon="Users" tone="lime" caption="Players connected right now">
              <span class="adm-num">{{ count(game.currentOnlinePlayers) }}</span>
            </AdminKpi>
            <AdminKpi label="Average DAU" :icon="Activity" tone="blue" :caption="`${plural(game.uniqueActivePlayers, 'unique player')} in ${days} days`">
              <span class="adm-num">{{ game.averageDailyActiveUsers.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
            </AdminKpi>
            <AdminKpi
              label="Avg Session Length"
              :icon="Timer"
              tone="ember"
              :caption="`Median ${ret.medianSessionMinutes} min · ${ret.sessionsPerActivePlayer} per player`"
            >
              <span class="adm-num">{{ ret.averageSessionMinutes }} min</span>
            </AdminKpi>
          </div>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <AdminPanel
              title="Crash Point Distribution"
              :caption="`${plural(game.roundsCrashed, 'round')} · average ${game.averageCrashMultiplier.toFixed(2)}x · ${pct(game.shareBelow2xPercentage)} crashed below 2x`"
              accent="ember"
            >
              <AdminBarChart
                label="Number of rounds crashing in each multiplier band"
                value-label="Rounds"
                :items="game.crashDistribution.map((b) => ({ label: b.label, value: b.count, detail: pct(b.percentage) }))"
                :height="210"
                :tone="2"
              />
            </AdminPanel>
            <AdminPanel title="Daily Active Users & Peak CCU" caption="Players per day" accent="blue">
              <AdminTrendChart
                label="Daily active users and peak concurrent players per day"
                :dates="game.daily.map((d) => d.date)"
                :series="[
                  { name: 'Daily active users', values: game.daily.map((d) => d.activeUsers) },
                  { name: 'Peak concurrent', values: game.daily.map((d) => d.peakConcurrent) },
                ]"
                :format="count"
                :height="210"
              />
            </AdminPanel>
          </div>

          <div class="grid gap-4 xl:grid-cols-2">
            <AdminPanel title="Player Retention" :caption="`${plural(ret.newPlayers, 'player')} signed up in the last ${days} days`" accent="lime">
              <AdminBarChart
                label="Rolling retention of new players on day 1, 7 and 30"
                value-label="Retained"
                :items="
                  ret.points.map((p) => ({
                    label: p.label,
                    value: p.percentage,
                    detail: p.eligible ? `${p.retained} of ${p.eligible} players` : 'no eligible players yet',
                  }))
                "
                :format="pct"
                :height="180"
                empty-text="No new players are old enough to measure yet (Day 1 needs a full day since signup)."
              />
            </AdminPanel>
            <AdminPanel title="Session Length" :caption="plural(ret.sessionsCounted, 'completed session')" accent="violet">
              <AdminBarChart
                label="Number of sessions by length"
                value-label="Sessions"
                :items="ret.sessionLengthDistribution.map((b) => ({ label: b.label, value: b.count }))"
                :height="180"
              />
            </AdminPanel>
          </div>
        </template>
      </div>
      <AdminLoading v-else-if="!loadError" text="Loading analytics…" />
    </AdminPage>
  </AdminShell>
</template>
