<script setup lang="ts">
import { computed } from 'vue'
import { Coins, HandCoins, Landmark, Gift, TrendingUp, Target, Wallet, Gauge, Activity, Sigma } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminInfo from '@/components/admin/AdminInfo.vue'
import ReconciliationPanel from '@/components/admin/ReconciliationPanel.vue'
import CapsExplainerPanel from '@/components/admin/CapsExplainerPanel.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { useReport } from '@/composables/useReport'
import { getRevenue } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { buildRevenueReport, luckCheck, luckVerdict, settledByLabel, Z_BANDS } from '@/lib/adminReports'
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
    theoretical: r.theoreticalRtpPercentage ?? 100 - r.houseEdgePercentage,
    wins: r.largestWins ?? [],
    caps: r.capEvents ?? [],
    capTotal: (r.capEvents ?? []).reduce((s, c) => s + c.count, 0),
    annotated: r.daily.filter((d) => d.annotation).length,
  }
})

const luck = computed(() => (data.value ? luckCheck(data.value) : null))
const zTone = computed(() => (luck.value?.band === 'normal' ? 'lime' : luck.value?.band === 'watch' ? 'ember' : 'magenta'))
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`

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
        <AdminKpi :label="k.ngr.label" :info="k.ngr.info" :icon="TrendingUp" :tone="v.ngr >= 0 ? 'lime' : 'magenta'" caption="Gross gaming revenue − bonus cost">
          <span class="adm-num">{{ cr(v.ngr) }}</span>
        </AdminKpi>
        <AdminKpi :label="k.rtp.label" :info="k.rtp.info" :icon="Gauge" tone="ember">
          <span class="adm-num">{{ pct2(data.actualRtpPercentage) }}</span>
          <template #caption>
            <span class="adm-num">vs {{ pct2(v.theoretical) }} theoretical</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.wagered.label" :info="k.wagered.info" :icon="Coins" tone="blue">
          <span class="adm-num">{{ cr(data.totalWagered) }}</span>
          <template #caption>
            <span class="adm-num">{{ count(data.betCount) }} bets · average {{ cr(data.averageBet) }}</span>
          </template>
        </AdminKpi>
        <AdminKpi :label="k.payouts.label" :info="k.payouts.info" :icon="HandCoins" tone="ember">
          <span class="adm-num">{{ cr(data.totalPayouts) }}</span>
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
      </div>

      <AdminPanel v-if="luck" :title="copy.revenue.luck.title" :caption="copy.revenue.luck.caption" accent="violet">
        <div class="adm-kpis">
          <AdminKpi :label="k.expected.label" :info="k.expected.info" :icon="Target" tone="violet" :caption="`Wagered ${cr(data.totalWagered)} × ${data.houseEdgePercentage}% edge`">
            <span class="adm-num">{{ cr(luck.expected) }}</span>
          </AdminKpi>
          <AdminKpi :label="k.gap.label" :info="k.gap.info" :icon="Landmark" :tone="luck.gap >= 0 ? 'lime' : 'magenta'" :caption="`Actual ${cr(luck.actual)} − expected`">
            <span class="adm-num">{{ cr(luck.gap) }}</span>
          </AdminKpi>
          <AdminKpi :label="k.sd.label" :info="k.sd.info" :icon="Activity" tone="blue" caption="A normal swing for these bets">
            <span class="adm-num">{{ luck.sd == null ? '—' : `±${cr(luck.sd)}` }}</span>
          </AdminKpi>
          <AdminKpi :label="k.z.label" :info="k.z.info" :icon="Sigma" :tone="zTone" caption="Gap ÷ standard deviation">
            <span class="adm-num">{{ luck.z == null ? '—' : signed(luck.z) }}</span>
          </AdminKpi>
        </div>

        <p class="adm-callout adm-callout--info mt-3">
          <Sigma aria-hidden="true" />
          <span>{{ luckVerdict(luck) }}</span>
        </p>

        <div class="adm-grid-2 mt-3">
          <div class="adm-table-wrap">
            <table class="adm-table">
              <caption class="adm-label text-left">How to read the z-score</caption>
              <thead>
                <tr>
                  <th>z-score</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in Z_BANDS" :key="b.key" :class="{ 'adm-row-current': b.key === luck.band }">
                  <td class="adm-strong">{{ b.range }}<span v-if="b.key === luck.band" class="adm-subline"> ← now</span></td>
                  <td>{{ b.meaning }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="space-y-2 text-sm leading-relaxed">
            <p class="adm-label !mb-0">Can profit still be negative?</p>
            <p>
              Yes, for a while. Every bet gives the house a small cut on average ({{ data.houseEdgePercentage }}%), but single bets are a coin flip,
              and a few big wins can wipe out the cut from hundreds of small bets.
            </p>
            <p>
              The cut adds up steadily with every bet. The luck mostly cancels out, so it grows far more slowly.
              Bet 100 times more and expected profit is 100 times bigger, but the normal swing is only 10 times bigger. With enough betting the cut always wins.
            </p>
            <p v-if="luck.lossChance != null">
              <strong>Right now:</strong> with this much betting, a period has about a <span class="adm-num">{{ pct2(luck.lossChance * 100) }}</span> chance of showing a loss by luck alone.
              <template v-if="luck.wageredForRareLoss != null">
                At this mix of bets, a loss becomes a 1-in-20 event once a period has about <span class="adm-num">{{ cr(luck.wageredForRareLoss) }}</span> wagered.
              </template>
            </p>
            <p v-if="data.sampleSizeNote" class="adm-subline">{{ data.sampleSizeNote }}</p>
          </div>
        </div>
      </AdminPanel>

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

      <CapsExplainerPanel />

      <ReconciliationPanel />
    </template>
  </ReportLayout>
</template>
