<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { RefreshCw, Play, Send } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import { getHealth, getRisk, resumeBetting, sendTestEmail } from '@/services/adminOpsService'
import type { TestEmailResult } from '@/services/adminOpsService'
import { useHouseLossAlert } from '@/composables/useHouseLossAlert'
import type { AdminHealth, AdminRiskResponse } from '@/types/admin'
import { count, cr, dateTime } from '@/lib/reportFormat'
import { admin as copy } from '@/copy/admin'

type Tone = 'ok' | 'bad' | 'warn' | 'info'

const health = ref<AdminHealth | null>(null)
const risk = ref<AdminRiskResponse | null>(null)
const error = ref('')
const riskError = ref('')
const loading = ref(false)
const resuming = ref(false)
const houseLoss = useHouseLossAlert()

async function load() {
  loading.value = true
  error.value = ''
  riskError.value = ''
  const [h, r] = await Promise.allSettled([getHealth(), getRisk()])
  if (h.status === 'fulfilled') health.value = h.value
  else error.value = 'Health check failed: the API did not answer. That itself is the red light.'
  if (r.status === 'fulfilled') {
    risk.value = r.value
    if (r.value.status.bettingPaused) {
      houseLoss.raise({ netGamingRevenueToday: r.value.status.netGamingRevenueToday, limit: r.value.status.dailyHouseLossLimit })
    }
  } else riskError.value = 'Risk status could not be loaded.'
  loading.value = false
}
onMounted(load)

async function resume() {
  resuming.value = true
  riskError.value = ''
  try {
    const status = await resumeBetting()
    if (risk.value) risk.value = { ...risk.value, status }
    houseLoss.dismiss()
  } catch (err) {
    riskError.value =
      (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ?? 'Resume failed.'
  } finally {
    resuming.value = false
  }
}

// "Send test email": proves SMTP works end to end, or shows the server's real error.
const testTo = ref('')
const testing = ref(false)
const testResult = ref<TestEmailResult | null>(null)
async function runTestEmail() {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await sendTestEmail(testTo.value.trim())
  } catch (err) {
    testResult.value = {
      ok: false,
      mode: health.value?.email ?? '',
      error: (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ?? 'The request failed.',
    }
  } finally {
    testing.value = false
  }
}

const tiles = computed<{ label: string; value: string; detail: string; tone: Tone }[]>(() => {
  const h = health.value
  if (!h) return []
  const p = h.payments
  return [
    { label: 'Database', value: h.database === 'ok' ? 'UP' : 'DOWN', detail: h.database === 'ok' ? 'Connected' : 'Cannot connect', tone: h.database === 'ok' ? 'ok' : 'bad' },
    {
      label: 'Live game',
      value: h.game === 'ok' ? 'RUNNING' : h.game.toUpperCase(),
      detail: h.round ? `Round #${h.round.roundNumber} · ${h.round.status} · ${h.round.currentMultiplier.toFixed(2)}x` : 'Round engine starting',
      tone: h.game === 'ok' ? 'ok' : 'warn',
    },
    { label: 'Players online', value: count(h.playersOnline), detail: 'Connected to the game hub', tone: 'info' },
    {
      label: 'Payments',
      value: p.usable ? 'READY' : 'OFF',
      detail: `Mode ${p.mode} · ${p.configured ? 'configured' : 'not configured'} · HTTPS ${p.httpsOk ? 'ok' : 'missing'} · switch ${p.adminSwitchOn ? 'on' : 'off'}`,
      tone: p.usable ? 'ok' : p.configured ? 'warn' : 'bad',
    },
    {
      label: 'AI insights',
      value: h.ai.primaryKey ? 'ON' : 'RULE-BASED',
      detail: `${h.ai.primaryKey ? 'Primary key ✓' : 'No primary key'} · ${h.ai.backupKey ? 'backup key ✓' : 'no backup key'} · ${h.ai.model}${h.ai.fallbackModel ? ` → ${h.ai.fallbackModel}` : ''}`,
      tone: h.ai.primaryKey ? 'ok' : 'warn',
    },
    { label: 'Email', value: String(h.email).toUpperCase(), detail: h.email === 'Log' ? 'Written to email-outbox/ (not sent)' : 'Sent by SMTP', tone: h.email === 'Log' ? 'warn' : 'ok' },
    { label: 'Login OTP', value: h.loginOtp ? 'ON' : 'OFF', detail: h.loginOtp ? 'A code is emailed at sign-in' : 'Password only', tone: h.loginOtp ? 'ok' : 'warn' },
    { label: 'Google sign-in', value: h.googleSignIn ? 'ON' : 'OFF', detail: h.googleSignIn ? 'Client ID set' : 'No client ID', tone: h.googleSignIn ? 'ok' : 'info' },
    { label: 'Version', value: h.version.split('+')[0] || h.version, detail: `Checked ${dateTime(h.checkedAtUtc)}`, tone: 'info' },
  ]
})

const lossUsed = computed(() => {
  const s = risk.value?.status
  if (!s || !s.dailyHouseLossLimit) return 0
  return Math.max(0, Math.min(100, (-s.netGamingRevenueToday / s.dailyHouseLossLimit) * 100))
})
</script>

<template>
  <AdminShell help-text="Each tile's dot and stripe: green = fine, amber = works but check it, pink = broken. Refresh before a demo. The daily loss limit pauses new bets when today's NGR falls below minus the limit; Resume lets bets continue for the rest of the day.">
    <AdminPage :title="copy.health.title" :eyebrow="copy.health.eyebrow" :subtitle="copy.health.subtitle">
      <template #actions>
        <AdminButton :disabled="loading" @click="load"><RefreshCw aria-hidden="true" />{{ loading ? 'Checking…' : 'Refresh' }}</AdminButton>
      </template>

      <p v-if="error" class="adm-banner" role="alert"><span>{{ error }}</span></p>

      <div v-if="tiles.length" class="adm-tiles" role="list" aria-label="System status">
        <div v-for="t in tiles" :key="t.label" role="listitem" :class="['adm-tile', `adm-tile--${t.tone === 'info' ? 'info' : t.tone}`]">
          <span class="adm-tile-label">{{ t.label }}</span>
          <span class="adm-tile-value adm-num">{{ t.value }}</span>
          <span class="adm-tile-detail">{{ t.detail }}</span>
        </div>
      </div>
      <AdminLoading v-else-if="!error" text="Checking…" />

      <AdminPanel title="Test email" caption="Sends a short message through the live email settings, so you can see whether verification and reset emails will arrive" accent="blue">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="runTestEmail">
          <label class="block min-w-0 flex-1">
            <span class="adm-label">Send to</span>
            <input v-model="testTo" type="email" required autocomplete="email" placeholder="you@example.com" class="adm-input w-full" />
          </label>
          <AdminButton type="submit" variant="primary" :disabled="testing || !testTo"><Send aria-hidden="true" />{{ testing ? 'Sending…' : 'Send test email' }}</AdminButton>
        </form>
        <p v-if="testResult?.ok" class="adm-success mt-3" role="status">{{ testResult.message }}</p>
        <p v-else-if="testResult" class="adm-error mt-3" role="alert">
          Not sent{{ testResult.server ? ` (${testResult.server})` : '' }}: {{ testResult.error }}
        </p>
      </AdminPanel>

      <AdminPanel title="Daily loss circuit breaker" caption="Pauses new bets when today's net gaming revenue (NGR, UTC day) falls below −limit" accent="ember">
        <template v-if="risk" #actions>
          <span :class="['adm-badge', risk.status.bettingPaused ? 'adm-badge--bad' : 'adm-badge--ok']">
            {{ risk.status.bettingPaused ? 'Bets paused' : risk.status.resumedByAdmin ? 'Resumed by admin' : 'Betting open' }}
          </span>
          <AdminButton v-if="risk.status.bettingPaused" variant="danger-solid" size="sm" :disabled="resuming" @click="resume">
            <Play aria-hidden="true" />{{ resuming ? 'Resuming…' : 'Resume betting today' }}
          </AdminButton>
        </template>
        <p v-if="riskError" class="adm-error" role="alert">{{ riskError }}</p>
        <template v-if="risk">
          <p class="adm-num text-[1.125rem] font-semibold text-[var(--adm-text)]">
            Today's net gaming revenue {{ cr(risk.status.netGamingRevenueToday) }} · limit −{{ cr(risk.status.dailyHouseLossLimit) }}
          </p>
          <div class="relative mt-2 h-3 rounded-full bg-[var(--adm-surface-3)]" role="img" :aria-label="`${lossUsed.toFixed(0)}% of the daily loss limit used`">
            <span class="absolute inset-y-0 left-0 rounded-full" :style="{ width: `${lossUsed}%`, background: lossUsed >= 100 ? 'var(--neon-magenta)' : lossUsed >= 60 ? 'var(--neon-orange)' : 'var(--neon-lime)' }" />
          </div>
          <p class="adm-subline mt-1">{{ lossUsed.toFixed(0) }}% of the limit used · {{ risk.status.day }} (UTC)</p>
          <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.9375rem] sm:grid-cols-3">
            <div><dt class="adm-label">Max multiplier</dt><dd class="adm-num m-0">{{ risk.limits.maxMultiplier }}×</dd></div>
            <div><dt class="adm-label">Max profit / bet</dt><dd class="adm-num m-0">{{ cr(risk.limits.maxProfitPerBet) }}</dd></div>
            <div><dt class="adm-label">Round liability</dt><dd class="adm-num m-0">{{ cr(risk.limits.maxRoundLiability) }}</dd></div>
            <div><dt class="adm-label">Min bet</dt><dd class="adm-num m-0">{{ cr(risk.limits.minBet) }} (no max)</dd></div>
            <div><dt class="adm-label">Bonus per stake</dt><dd class="adm-num m-0">{{ cr(risk.limits.maxBetFromBonusBalance) }}</dd></div>
            <div><dt class="adm-label">Wagering</dt><dd class="adm-num m-0">{{ risk.limits.bonusWageringMultiple }}× in {{ risk.limits.bonusExpiryDays }} days</dd></div>
          </dl>
        </template>
      </AdminPanel>
    </AdminPage>
  </AdminShell>
</template>
