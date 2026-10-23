<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CircleAlert, CircleCheck, KeyRound } from '@lucide/vue'
import AdminDialog from './AdminDialog.vue'
import AdminButton from './AdminButton.vue'
import * as service from '@/services/adminSettingsService'
import type { EditableLimits, LimitsSettings } from '@/services/adminSettingsService'
import { usePlayerStore } from '@/stores/playerStore'
import { apiMessage } from '@/lib/apiError'
import { dateTime } from '@/lib/reportFormat'

/**
 * Change the risk limits (max multiplier, profit cap, stakes, round liability, daily loss
 * limit, bonus stake cap) behind the settings password. The first password is set by a
 * manager with their own login password; after that anyone who knows it can change it.
 */
const emit = defineEmits<{ close: []; saved: [] }>()
const isManager = computed(() => !!usePlayerStore().profile?.isManager)

const state = ref<LimitsSettings | null>(null)
const form = ref<EditableLimits | null>(null)
const loadError = ref('')
const tab = ref<'limits' | 'password'>('limits')

const settingsPassword = ref('')
const current = ref('')
const next = ref('')
const confirm = ref('')
const busy = ref(false)
const error = ref('')
const done = ref('')

const fields: { key: keyof EditableLimits; label: string; hint: string; suffix: string }[] = [
  { key: 'maxMultiplier', label: 'Max multiplier', hint: 'Rounds never fly past this. 2–10 000.', suffix: '×' },
  { key: 'maxProfitPerBet', label: 'Max profit per bet', hint: 'A bet is cashed out once its profit hits this.', suffix: 'R' },
  { key: 'minBet', label: 'Minimum bet', hint: 'Smallest stake allowed.', suffix: 'R' },
  { key: 'maxRoundLiability', label: 'Round liability', hint: 'At least twice the minimum bet.', suffix: 'R' },
  { key: 'dailyHouseLossLimit', label: 'Daily house loss limit', hint: 'Betting pauses past this loss. 0 turns it off.', suffix: 'R' },
  { key: 'maxBetFromBonusBalance', label: 'Bonus stake cap', hint: 'Most of a stake that can be bonus credits.', suffix: 'R' },
]

function show(s: LimitsSettings) {
  state.value = s
  form.value = { ...s.limits }
  if (!s.passwordSet) tab.value = 'password'
}

onMounted(async () => {
  try {
    show(await service.getLimits())
  } catch (e) {
    loadError.value = apiMessage(e) ?? 'Could not load the limits.'
  }
})

async function saveLimits() {
  if (!form.value) return
  error.value = ''
  done.value = ''
  if (!settingsPassword.value) return void (error.value = 'Enter the settings password.')
  busy.value = true
  try {
    show(await service.updateLimits(form.value, settingsPassword.value))
    settingsPassword.value = ''
    done.value = 'Limits saved. They apply from the next bet.'
    emit('saved')
  } catch (e) {
    error.value = apiMessage(e) ?? 'Could not save the limits.'
  } finally {
    busy.value = false
  }
}

async function savePassword() {
  error.value = ''
  done.value = ''
  if (next.value !== confirm.value) return void (error.value = 'New passwords do not match.')
  busy.value = true
  try {
    const first = !state.value?.passwordSet
    show(await service.changeSettingsPassword(current.value, next.value))
    current.value = next.value = confirm.value = ''
    done.value = first ? 'Settings password set. You can now change the limits.' : 'Settings password changed.'
    tab.value = 'limits'
  } catch (e) {
    error.value = apiMessage(e) ?? 'Could not change the password.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AdminDialog title="Change limits" sub="Protected by the settings password. Every change is audited." tone="var(--neon-orange)" wide @close="emit('close')">
    <template #icon><KeyRound /></template>

    <p v-if="loadError" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ loadError }}</p>
    <p v-else-if="!state || !form" class="adm-subline">Loading…</p>
    <template v-else>
      <div class="mb-3 flex flex-wrap gap-2" role="tablist">
        <AdminButton size="sm" :variant="tab === 'limits' ? 'primary' : 'ghost'" :disabled="!state.passwordSet" role="tab" :aria-selected="tab === 'limits'" @click="tab = 'limits'">Limits</AdminButton>
        <AdminButton size="sm" :variant="tab === 'password' ? 'primary' : 'ghost'" role="tab" :aria-selected="tab === 'password'" @click="tab = 'password'">
          {{ state.passwordSet ? 'Change settings password' : 'Set settings password' }}
        </AdminButton>
      </div>

      <form v-if="tab === 'limits'" class="flex flex-col gap-3" @submit.prevent="saveLimits">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label v-for="f in fields" :key="f.key" class="block">
            <span class="adm-label">{{ f.label }} ({{ f.suffix }})</span>
            <input v-model.number="form[f.key]" type="number" min="0" step="any" inputmode="decimal" class="adm-input adm-num w-full" required />
            <span class="adm-subline block">{{ f.hint }}</span>
          </label>
        </div>
        <label class="block">
          <span class="adm-label">Settings password</span>
          <input v-model="settingsPassword" type="password" autocomplete="off" class="adm-input w-full" />
        </label>
        <p v-if="state.updatedAtUtc" class="adm-subline">
          Last changed {{ dateTime(state.updatedAtUtc) }}<template v-if="state.updatedByUsername"> by {{ state.updatedByUsername }}</template>.
        </p>
        <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
      </form>

      <form v-else class="flex flex-col gap-3" @submit.prevent="savePassword">
        <p v-if="!state.passwordSet" class="adm-callout">
          <span>
            No settings password yet. A manager sets the first one, confirming with their own login password.
            <template v-if="!isManager"> Ask a manager to do this.</template>
          </span>
        </p>
        <label class="block">
          <span class="adm-label">{{ state.passwordSet ? 'Current settings password' : 'Your login password' }}</span>
          <input v-model="current" type="password" autocomplete="off" class="adm-input w-full" required />
        </label>
        <label class="block">
          <span class="adm-label">New settings password</span>
          <input v-model="next" type="password" autocomplete="new-password" class="adm-input w-full" required />
          <span class="adm-subline block">8+ characters, a capital letter and a number.</span>
        </label>
        <label class="block">
          <span class="adm-label">Confirm new password</span>
          <input v-model="confirm" type="password" autocomplete="new-password" class="adm-input w-full" required />
        </label>
        <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
      </form>

      <p v-if="error" class="adm-error mt-3" role="alert"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>
      <p v-if="done" class="adm-success mt-3 flex items-center gap-2" role="status"><CircleCheck class="h-4 w-4" aria-hidden="true" />{{ done }}</p>
    </template>

    <template #footer>
      <AdminButton variant="ghost" @click="emit('close')">Close</AdminButton>
      <AdminButton v-if="state && tab === 'limits'" variant="danger-solid" :disabled="busy || !state.passwordSet" @click="saveLimits">
        {{ busy ? 'Saving…' : 'Save limits' }}
      </AdminButton>
      <AdminButton v-else-if="state" variant="danger-solid" :disabled="busy" @click="savePassword">
        {{ busy ? 'Saving…' : state.passwordSet ? 'Change password' : 'Set password' }}
      </AdminButton>
    </template>
  </AdminDialog>
</template>
