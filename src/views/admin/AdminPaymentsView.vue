<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { CircleCheck, CreditCard, ShieldAlert } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import * as service from '@/services/adminAnalyticsService'
import type { PaymentSettings } from '@/types/insights'

// The payment gateway's on/off switch. Players only see "Buy credits" while purchases are open.
const settings = ref<PaymentSettings | null>(null)
const saving = ref(false)
const message = ref<{ ok: boolean; text: string } | null>(null)

onMounted(async () => {
  settings.value = await service.getPaymentSettings()
})

async function toggle() {
  if (!settings.value || saving.value) return
  saving.value = true
  message.value = null
  try {
    settings.value = await service.updatePaymentSettings(!settings.value.enabled)
    message.value = {
      ok: true,
      text: settings.value.purchasesOpen
        ? 'Payments are on. Players can buy credits.'
        : settings.value.enabled
          ? 'Switched on, but the gateway is not usable yet (see below).'
          : 'Payments are off. Buying credits is hidden from players.',
    }
  } catch (err: unknown) {
    const m = axios.isAxiosError(err)
      ? (err.response?.data as { message?: string })?.message
      : undefined
    message.value = { ok: false, text: m ?? 'Could not save.' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminShell>
    <AdminPage
      title="Payments"
      eyebrow="Game management"
      subtitle="Turn buying credits through the payment gateway on or off."
    >
      <div class="adm-grid-2">
        <AdminPanel title="Payment gateway" caption="PayFast" accent="ember">
          <div v-if="settings" class="flex flex-col gap-5">
            <div class="flex items-center gap-4">
              <CreditCard class="h-8 w-8 shrink-0 text-[var(--adm-text-2)]" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="text-[18px] font-bold text-[var(--adm-text)]">Buying credits</p>
                <p class="text-[14px] text-[var(--adm-text-3)]">
                  {{
                    settings.purchasesOpen
                      ? 'Open: players see "Buy credits" in the top bar and their wallet.'
                      : 'Hidden from players.'
                  }}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="settings.enabled"
                aria-label="Payments"
                :disabled="saving"
                :class="[
                  'relative h-9 w-[4.5rem] shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-violet)] disabled:opacity-60',
                  settings.enabled
                    ? 'border-[var(--neon-lime)] bg-[var(--neon-lime)]'
                    : 'border-[var(--adm-border-strong)] bg-[var(--adm-surface-3)]',
                ]"
                @click="toggle"
              >
                <span
                  :class="[
                    'absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow transition-all',
                    settings.enabled ? 'left-[calc(100%-1.75rem)]' : 'left-1',
                  ]"
                />
                <span class="sr-only">{{ settings.enabled ? 'On' : 'Off' }}</span>
              </button>
              <span
                class="w-8 text-[16px] font-bold"
                :class="settings.enabled ? 'adm-success' : 'text-[var(--adm-text-3)]'"
              >
                {{ settings.enabled ? 'ON' : 'OFF' }}
              </span>
            </div>
            <p
              v-if="message"
              role="status"
              :class="message.ok ? 'adm-success flex items-center gap-2' : 'adm-error'"
            >
              <CircleCheck v-if="message.ok" class="h-4 w-4" aria-hidden="true" />{{ message.text }}
            </p>
          </div>
          <AdminLoading v-else />
        </AdminPanel>

        <AdminPanel
          title="Gateway status"
          caption="Set in the API's appsettings.json"
          accent="violet"
        >
          <dl v-if="settings" class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[16px]">
            <dt class="text-[var(--adm-text-3)]">Credentials</dt>
            <dd class="font-bold" :class="settings.gatewayConfigured ? 'adm-success' : 'adm-error'">
              {{ settings.gatewayConfigured ? 'Configured' : 'Missing' }}
            </dd>
            <dt class="text-[var(--adm-text-3)]">Mode</dt>
            <dd class="font-bold text-[var(--adm-text)]">
              {{ settings.sandbox ? 'Sandbox (demo money only)' : 'Live' }}
            </dd>
            <dt class="text-[var(--adm-text-3)]">Live payments</dt>
            <dd class="font-bold text-[var(--adm-text)]">
              {{ settings.livePaymentsAllowed ? 'Allowed' : 'Blocked' }}
            </dd>
          </dl>
          <p
            v-if="settings && !settings.sandbox && !settings.livePaymentsAllowed"
            class="adm-error mt-4 flex items-start gap-2"
          >
            <ShieldAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            The gateway is set to live mode, which is blocked. Purchases stay closed until it runs
            in sandbox.
          </p>
          <p class="adm-note mt-4">
            Purchases only open when this switch is on and the gateway is usable. Credits are added
            when PayFast confirms the payment, so the API must be reachable from the internet for
            sandbox purchases to land.
          </p>
        </AdminPanel>
      </div>
    </AdminPage>
  </AdminShell>
</template>
