<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NeonPanel from './NeonPanel.vue'
import InfoTip from './InfoTip.vue'
import ArcadeButton from './ArcadeButton.vue'
import * as responsiblePlayService from '@/services/responsiblePlayService'
import * as rulesService from '@/services/rulesService'
import { useRulesStore } from '@/stores/rulesStore'
import { useToastStore } from '@/stores/toastStore'
import { apiMessage } from '@/lib/apiError'
import { creditAmount, dateTime } from '@/lib/format'
import type { LossLimits } from '@/types'
import { en } from '@/copy/en'

/**
 * Responsible play on the profile: daily / weekly loss limits (lowering applies now, raising
 * waits 24 h and shows when), and self-exclusion for 24 h / 7 / 30 days with a confirmation
 * step on the page itself.
 */
const t = en.responsible
const rulesStore = useRulesStore()
const toast = useToastStore()

const limits = ref<LossLimits | null>(null)
const daily = ref<string>('')
const weekly = ref<string>('')
const saving = ref(false)
const limitError = ref<string | null>(null)

const BREAKS = [1, 7, 30] as const
type BreakDays = (typeof BREAKS)[number]
const chosen = ref<BreakDays | null>(null)
const excluding = ref(false)
const breakMessage = ref<string | null>(null)
const breakError = ref<string | null>(null)

/** While a raise (or removal) waits out its 24 h, the fields show the chosen limit, not the active one. */
function fill(l: LossLimits) {
  limits.value = l
  const waiting = l.pendingFromUtc !== null
  const d = waiting ? l.pendingDaily : l.daily
  const w = waiting ? l.pendingWeekly : l.weekly
  daily.value = d === null ? '' : String(d)
  weekly.value = w === null ? '' : String(w)
}

const limitText = (n: number | null) => (n === null ? t.none : creditAmount(n))

/** "Active now: X · Changes to Y on <date>" for a field whose change is still waiting; else null. */
function pendingNote(active: number | null, next: number | null): string | null {
  const from = limits.value?.pendingFromUtc
  if (!from || active === next) return null
  return `${t.activeNow(limitText(active))} · ${t.changesTo(limitText(next), dateTime(from))}`
}
const dailyNote = computed(() => (limits.value ? pendingNote(limits.value.daily, limits.value.pendingDaily) : null))
const weeklyNote = computed(() => (limits.value ? pendingNote(limits.value.weekly, limits.value.pendingWeekly) : null))

onMounted(async () => {
  try {
    fill(await responsiblePlayService.getLimits())
  } catch {
    // Older server: the section still offers a break.
  }
})

/** '' → no limit; otherwise a positive number, or undefined when invalid. */
function parse(v: string | number): number | null | undefined {
  const text = String(v ?? '').trim()
  if (text === '') return null
  const n = Number(text)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

const pendingLine = computed(() => {
  const l = limits.value
  if (!l?.pendingFromUtc || (!dailyNote.value && !weeklyNote.value)) return null
  return t.pending(dateTime(l.pendingFromUtc))
})

async function saveLimits() {
  limitError.value = null
  const d = parse(daily.value)
  const w = parse(weekly.value)
  if (d === undefined || w === undefined) {
    limitError.value = t.invalid
    return
  }
  if (d !== null && w !== null && w < d) {
    limitError.value = t.weeklyBelowDaily
    return
  }
  saving.value = true
  try {
    fill(await responsiblePlayService.setLimits(d, w))
    toast.push({ title: t.saved, message: pendingLine.value ?? '', accent: 'lime' })
  } catch (err) {
    limitError.value = apiMessage(err) ?? en.common.tryAgain
  } finally {
    saving.value = false
  }
}

async function startBreak() {
  if (!chosen.value) return
  excluding.value = true
  breakError.value = null
  try {
    const res = await rulesService.selfExclude(chosen.value)
    breakMessage.value = t.breakStarted(dateTime(res.endsAtUtc))
    chosen.value = null
    void rulesStore.loadStanding()
  } catch (err) {
    breakError.value = apiMessage(err) ?? en.common.tryAgain
  } finally {
    excluding.value = false
  }
}
</script>

<template>
  <NeonPanel id="responsible-play" class="scroll-mt-4" :title="t.title" accent="ember">
    <form class="space-y-3" @submit.prevent="saveLimits">
      <p class="flex items-center gap-1 font-display text-[0.625rem] font-black uppercase tracking-[0.24em] text-ember">
        {{ t.limitsTitle }} <InfoTip :text="t.limitsInfo" :label="t.limitsTitle" />
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.daily }}</span>
          <input
            v-model="daily"
            type="number"
            inputmode="decimal"
            min="1"
            step="any"
            :placeholder="t.none"
            class="clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-ember focus:outline-none"
          />
          <span v-if="limits" class="mt-1 block text-xs text-muted-foreground">{{ t.lostToday(creditAmount(limits.netLossToday)) }}</span>
          <span v-if="dailyNote" class="mt-1 block text-xs text-ember">{{ dailyNote }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.weekly }}</span>
          <input
            v-model="weekly"
            type="number"
            inputmode="decimal"
            min="1"
            step="any"
            :placeholder="t.none"
            class="clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-ember focus:outline-none"
          />
          <span v-if="limits" class="mt-1 block text-xs text-muted-foreground">{{ t.lostWeek(creditAmount(limits.netLossThisWeek)) }}</span>
          <span v-if="weeklyNote" class="mt-1 block text-xs text-ember">{{ weeklyNote }}</span>
        </label>
      </div>
      <p v-if="pendingLine" class="text-sm text-ember" role="status">{{ pendingLine }}</p>
      <p v-if="limitError" role="alert" class="text-sm text-danger">{{ limitError }}</p>
      <ArcadeButton type="submit" size="sm" variant="blue" :disabled="saving">{{ saving ? en.common.saving : en.common.save }}</ArcadeButton>
    </form>

    <div id="take-a-break" class="mt-5 scroll-mt-4 border-t border-violet/40 pt-4">
      <p class="flex items-center gap-1 font-display text-[0.625rem] font-black uppercase tracking-[0.24em] text-ember">
        {{ t.breakTitle }} <InfoTip :text="t.breakInfo" :label="t.breakTitle" />
      </p>
      <p v-if="breakMessage" class="mt-2 text-sm font-semibold text-lime" role="status">{{ breakMessage }}</p>
      <template v-else>
        <div class="mt-2 flex flex-wrap gap-2" role="group" :aria-label="t.breakTitle">
          <button
            v-for="d in BREAKS"
            :key="d"
            type="button"
            :aria-pressed="chosen === d"
            :class="[
              'clip-hud border-2 px-3 py-1.5 font-display text-[0.625rem] font-black uppercase tracking-[0.14em] transition-all pointer-coarse:min-h-11',
              chosen === d ? 'border-ember text-ember [box-shadow:var(--glow-ember)]' : 'border-violet/50 text-muted-foreground hover:border-ember hover:text-ember',
            ]"
            @click="chosen = chosen === d ? null : d"
          >
            {{ t.breakOptions[d] }}
          </button>
        </div>
        <!-- The confirmation step lives on the page: no browser pop-up. -->
        <div v-if="chosen" class="mt-3 border-2 border-ember/70 bg-ember/10 p-3" role="alertdialog" aria-labelledby="break-confirm">
          <p id="break-confirm" class="text-base font-semibold text-foreground">{{ t.breakConfirm(t.breakOptions[chosen]) }}</p>
          <p class="text-sm text-foreground/80">{{ t.breakConfirmLine }}</p>
          <p v-if="breakError" role="alert" class="mt-1 text-sm text-danger">{{ breakError }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <ArcadeButton type="button" size="sm" variant="ghost" @click="chosen = null">{{ en.common.cancel }}</ArcadeButton>
            <ArcadeButton type="button" size="sm" variant="danger" :disabled="excluding" @click="startBreak">{{ t.breakStart }}</ArcadeButton>
          </div>
        </div>
      </template>
    </div>
  </NeonPanel>
</template>
