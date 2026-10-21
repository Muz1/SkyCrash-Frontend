<script setup lang="ts">
import { computed } from 'vue'
import { Coins, HandCoins, Landmark, Gift, TrendingUp, Percent, Scale, Target, Wallet, Gauge, Info } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminInfo from '@/components/admin/AdminInfo.vue'
import ReconciliationPanel from '@/components/admin/ReconciliationPanel.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { useReport } from '@/composables/useReport'
import { getRevenue } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { buildRevenueReport, settledByLabel } from '@/lib/adminReports'
import { count, cr, dateTime, mult, pct2, zar } from '@/lib/reportFormat'
import { admin as copy } from '@/copy/admin'

const { query, data, loading, error } = useReport(getRevenue)
const k = copy.revenue.kpi

// Older APIs only send the original fields; fall back to them.
const v = computed(() => {
  const r = data.value
  if (!r) return null
  return {
    ggr: r.ggr ?? r.grossRevenue,
    ngr: r.ngr ?? r.netProfit,
    bonusCost: r.bonusCost ?? r.freeCreditsGiven,
    bySource: r.bonusCostBySource ?? r.freeCreditsBreakdown,
    hold: r.holdPercentage ?? (r.totalWagered ? ((r.totalWagered - r.totalPayouts) / r.totalWagered) * 100 : null),
    ngrMargin: r.ngrMarginPercentage ?? r.profitMarginPercentage,
    theoretical: r.theoreticalRtpPercentage ?? 100 - r.houseEdgePercentage,
    wins: r.largestWins ?? [],
    caps: r.capEvents ?? [],
    capTotal: (r.capEvents ?? []).reduce((s, c) => s + c.count, 0),
    annotated: r.daily.filter((d) => d.annotation).length,
  }
})

const zText = computed(() => {
  const z = data.value?.gapZScore
  return z == null ? 'z n/a' : `z ${z >= 0 ? '+' : '−'}${Math.abs(z).toFixed(2)}`
})

function buildReport() {
  return data.value ? buildRevenueReport(data.value) : null
}
</script>

<template>
  <ReportLayout
    v-model:query="query"
    :title="copy.revenue.title"
    :eyebrow="copy.revenue.eyebrow"
    :subtitle="copy.revenue.subtitle"
    :about="ABOUT.revenue!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
    :page-export="false"
    test-toggle
  >
    <template #actions>
      <ExportPdfButton :build="buildReport" />
    </template>

    <template v-if="data && v">
      <div class="adm-kpis">
        <AdminKpi :label="k.ggr.label" :info="k.ggr.info" :icon="Landmark" :tone="v.ggr >= 0 ? 'violet' : 'magenta'">
          <span class="adm-num">{{ cr(v.ggr) }}</span>
          <template #caption>
            <span class="adm-num">Cash {{ cr(data.ggrCash) }} · Bonus {{ cr(data.ggrBonus) }}</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.expected.label" :info="k.expected.info" :icon="Target" tone="violet">
          <span class="adm-num">{{ cr(data.expectedGrossRevenue) }}</span>
          <template #caption>
            <span class="adm-num">
              Gap {{ cr(data.gapToExpected ?? v.ggr - data.expectedGrossRevenue) }} · {{ zText }}
              <template v-if="data.ggrStandardDeviation != null"> · SD {{ cr(data.ggrStandardDeviation) }}</template>
            </span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.rtp.label" :info="k.rtp.info" :icon="Gauge" tone="ember">
          <span class="adm-num">{{ pct2(data.actualRtpPercentage) }}</span>
          <template #caption>
            <span class="adm-num">vs {{ pct2(v.theoretical) }} theoretical</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.ngr.label" :info="k.ngr.info" :icon="TrendingUp" :tone="v.ngr >= 0 ? 'lime' : 'magenta'" caption="Gross gaming revenue − bonus cost">
          <span class="adm-num">{{ cr(v.ngr) }}</span>
        </AdminKpi>
        <AdminKpi :label="k.hold.label" :info="k.hold.info" :icon="Percent" tone="blue" caption="Gross gaming revenue ÷ wagered">
          <span class="adm-num">{{ pct2(v.hold) }}</span>
        </AdminKpi>
        <AdminKpi :label="k.ngrMargin.label" :info="k.ngrMargin.info" :icon="Percent" tone="lime" caption="Net gaming revenue ÷ wagered">
          <span class="adm-num">{{ pct2(v.ngrMargin) }}</span>
        </AdminKpi>
        <AdminKpi :label="k.bonusCost.label" :info="k.bonusCost.info" :icon="Gift" tone="magenta">
          <span class="adm-num">{{ cr(v.bonusCost) }}</span>
          <template #caption>
            <span class="adm-num">Forfeited {{ cr(data.bonusForfeited) }}</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.purchases.label" :info="k.purchases.info" :icon="Wallet" tone="lime">
          <span class="adm-num">{{ zar(data.purchaseRevenueZar) }}</span>
          <template #caption>
            <span class="adm-num">{{ count(data.purchaseCount) }} purchases · {{ cr(data.creditsSold) }} credits sold</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.wagered.label" :info="k.wagered.info" :icon="Coins" tone="blue">
          <span class="adm-num">{{ cr(data.totalWagered) }}</span>
          <template #caption>
            <span class="adm-num">{{ count(data.betCount) }} bets · cash {{ cr(data.cashWagered) }} · bonus {{ cr(data.bonusWagered) }}</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.payouts.label" :info="k.payouts.info" :icon="HandCoins" tone="ember">
          <span class="adm-num">{{ cr(data.totalPayouts) }}</span>
        </AdminKpi>
        <AdminKpi :label="k.avgBet.label" :info="k.avgBet.info" :icon="Scale" tone="blue">
          <span class="adm-num">{{ cr(data.averageBet) }}</span>
        </AdminKpi>
      </div>

      <p v-if="data.gapExplanation" class="adm-callout adm-callout--info">
        <Info aria-hidden="true" />
        <span>{{ data.gapExplanation }}</span>
      </p>
      <p v-if="data.sampleSizeNote" class="adm-callout">
        <Gauge aria-hidden="true" />
        <span><strong>Return to player (RTP) sample size:</strong> {{ data.sampleSizeNote }}</span>
      </p>
      <p class="adm-note">{{ copy.credits.note }}</p>

      <div class="adm-grid-2">
        <AdminPanel title="Bets vs payouts" caption="Credits per day, one axis" accent="blue">
          <AdminTrendChart
            label="Daily bets versus payouts"
            :dates="data.daily.map((d) => d.date)"
            :series="[
              { name: 'Wagered', values: data.daily.map((d) => d.wagered) },
              { name: 'Paid out', values: data.daily.map((d) => d.payouts) },
            ]"
            :annotations="data.daily.map((d) => d.annotation)"
            :format="cr"
            :height="240"
          />
        </AdminPanel>
        <AdminPanel title="Revenue & profit over time" caption="Gross and net gaming revenue per day. Below zero is a loss." accent="lime">
          <AdminTrendChart
            label="Daily gross and net gaming revenue"
            :dates="data.daily.map((d) => d.date)"
            :series="[
              { name: 'Gross gaming revenue', values: data.daily.map((d) => d.ggr ?? d.grossRevenue) },
              { name: 'Net gaming revenue', values: data.daily.map((d) => d.ngr ?? d.netProfit) },
            ]"
            :annotations="data.daily.map((d) => d.annotation)"
            :format="cr"
            :height="240"
          />
          <p v-if="v.annotated" class="adm-subline mt-2">
            <span aria-hidden="true" class="text-[#f59e0b]">▼</span> {{ copy.revenue.annotationLegend }}
          </p>
        </AdminPanel>
        <AdminPanel title="Bonus cost by source" caption="Free credits granted, counted as a cost" accent="magenta">
          <AdminBarChart
            label="Bonus cost by source"
            value-label="Credits"
            horizontal
            :items="v.bySource.map((b) => ({ label: b.label, value: Math.max(0, b.amount) }))"
            :format="cr"
            empty-text="No bonus credits were granted in this range."
          />
        </AdminPanel>
        <AdminPanel :title="copy.revenue.capEvents.title" :caption="`${count(v.capTotal)} bets · ${copy.revenue.capEvents.caption}`" accent="ember" flush>
          <div class="adm-table-wrap">
            <table class="adm-table adm-table--cards">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th class="adm-num">Bets</th>
                  <th class="adm-num">Payouts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in v.caps" :key="c.reason">
                  <td class="adm-strong" data-label="Reason">{{ settledByLabel(c.reason) }}</td>
                  <td class="adm-num" data-label="Bets">{{ count(c.count) }}</td>
                  <td class="adm-num" data-label="Payouts">{{ cr(c.payouts) }}</td>
                </tr>
                <tr v-if="!v.caps.length">
                  <td colspan="3" class="adm-empty">{{ copy.revenue.capEvents.empty }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel :title="copy.revenue.largestWins.title" :caption="copy.revenue.largestWins.caption" accent="violet" flush>
        <template #actions>
          <span class="adm-subline">Settled by</span>
          <AdminInfo
            term="Settled by"
            text="Manual = the player cashed out. Auto target = their auto cash-out. Profit cap, Max multiplier and Round liability = a risk cap cashed the bet out. TEST = a test account."
          />
        </template>
        <div class="adm-table-wrap">
          <table class="adm-table adm-table--cards min-w-[50rem]">
            <thead>
              <tr>
                <th>Player</th>
                <th class="adm-num">Stake</th>
                <th class="adm-num">Cash-out</th>
                <th class="adm-num">Crash</th>
                <th class="adm-num">Payout</th>
                <th>Settled by</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in v.wins" :key="w.betId">
                <td class="adm-strong" data-label="Player">
                  {{ w.username }}<span v-if="w.isTestAccount" class="adm-test-mark" title="Test account">TEST</span>
                </td>
                <td class="adm-num" data-label="Stake">{{ cr(w.stake) }}</td>
                <td class="adm-num" data-label="Cash-out">{{ mult(w.cashOutMultiplier) }}</td>
                <td class="adm-num" data-label="Crash">{{ mult(w.crashMultiplier) }}</td>
                <td class="adm-num adm-strong" data-label="Payout">{{ cr(w.payout) }}</td>
                <td data-label="Settled by">{{ settledByLabel(w.settledBy) }}</td>
                <td class="adm-muted adm-num-inline" data-label="When">#{{ w.roundNumber }} · {{ dateTime(w.placedAtUtc) }}</td>
              </tr>
              <tr v-if="!v.wins.length">
                <td colspan="7" class="adm-empty">No winning bets in this range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <ReconciliationPanel />
    </template>
  </ReportLayout>
</template>
