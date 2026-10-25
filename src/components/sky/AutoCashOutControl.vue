<script setup lang="ts">
import { computed, ref } from 'vue'
import { Zap } from '@lucide/vue'
import { AUTO_PRESETS, MIN_AUTO_TARGET } from '@/lib/gameRules'
import { en } from '@/copy/en'

/**
 * Auto Cash Out, front and centre next to the bet controls. A clear ON/OFF switch, the
 * target multiplier with quick presets, and one line saying exactly what will happen.
 * Once a bet is placed the target is fixed for that flight (the server holds it), so the
 * card turns into a read-only "armed" banner.
 */
const enabled = defineModel<boolean>('enabled', { required: true })
const target = defineModel<number>('target', { required: true })

const props = defineProps<{
  /** Target the server holds for my live bet: null = this flight has no auto cash out. */
  armedTarget: number | null
  /** True while I have a live bet, so settings can't change mid-flight. */
  locked: boolean
  error: string | null
  /** The round cap (public rules): no preset above it, and the input stops there. */
  max?: number | null
}>()

const presets = computed(() => AUTO_PRESETS.filter((p) => props.max == null || p <= props.max))
const isCustom = computed(() => enabled.value && !presets.value.includes(target.value as (typeof AUTO_PRESETS)[number]))
const input = ref<HTMLInputElement | null>(null)

/** "Custom": switch on and jump into the number field. */
function pickCustom() {
  enabled.value = true
  input.value?.focus()
  input.value?.select()
}
const shown = computed(() => (Number.isFinite(target.value) ? target.value : 0))
</script>

<template>
  <!-- Live bet: show what's actually armed on the server. -->
  <div
    v-if="props.locked"
    :class="[
      'clip-hud flex min-w-0 items-center gap-2 border-2 px-2.5 py-1.5',
      props.armedTarget
        ? 'border-electric bg-electric/10 [box-shadow:var(--glow-blue)]'
        : 'border-violet/40 bg-void/60',
    ]"
    role="status"
    :title="
      props.armedTarget
        ? 'Cashes out for you when the plane reaches it.'
        : 'Press CASH OUT yourself this flight.'
    "
  >
    <Zap
      :class="['h-4 w-4 shrink-0', props.armedTarget ? 'text-electric' : 'text-muted-foreground']"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <p
        class="font-arcade text-[0.5rem] uppercase tracking-[0.2em]"
        :class="props.armedTarget ? 'text-electric' : 'text-muted-foreground'"
      >
        {{
          props.armedTarget
            ? `Auto Cash Out: ${props.armedTarget.toFixed(2)}x`
            : 'Auto Cash Out: Off'
        }}
      </p>
    </div>
  </div>

  <fieldset
    v-else
    :class="[
      'clip-hud min-w-0 max-w-full border-2 px-2 py-1 transition-all',
      enabled
        ? 'border-electric bg-electric/10 [box-shadow:var(--glow-blue)]'
        : 'border-violet/50 bg-void/60',
    ]"
  >
    <legend class="sr-only">Auto Cash Out</legend>
    <div
      class="flex items-center gap-2"
      :title="
        enabled
          ? `On: cashes out for you at ${shown.toFixed(2)}x, even if you don't press CASH OUT.`
          : 'Off: you press CASH OUT yourself.'
      "
    >
      <Zap
        :class="['h-4 w-4 shrink-0', enabled ? 'text-electric' : 'text-muted-foreground']"
        aria-hidden="true"
      />
      <span
        class="hidden font-arcade text-[0.5rem] uppercase tracking-[0.2em] sm:inline"
        :class="enabled ? 'text-electric' : 'text-foreground'"
        >Auto</span
      >
      <button
        type="button"
        role="switch"
        :aria-checked="enabled"
        aria-label="Auto Cash Out"
        :class="[
          'flex shrink-0 items-center gap-1.5 border-2 px-1 py-0.5 font-arcade text-[0.5rem] uppercase pointer-coarse:min-h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric',
          enabled ? 'border-electric text-electric' : 'border-violet/60 text-muted-foreground',
        ]"
        @click="enabled = !enabled"
      >
        <span
          :class="[
            'grid h-4 w-8 items-center border border-current px-0.5',
            enabled ? 'justify-items-end bg-electric/25' : 'justify-items-start',
          ]"
        >
          <span :class="['block h-2.5 w-2.5', enabled ? 'bg-electric' : 'bg-muted-foreground']" />
        </span>
        {{ enabled ? 'On' : 'Off' }}
      </button>
      <label class="flex shrink-0 items-center gap-1">
        <span class="sr-only">Auto cash out target multiplier</span>
        <input
          ref="input"
          v-model.number="target"
          type="number"
          inputmode="decimal"
          :min="MIN_AUTO_TARGET"
          :max="props.max ?? undefined"
          step="0.05"
          class="block w-[calc(5rem*var(--text-scale,1))] border-2 border-violet/50 bg-void/70 px-2 py-0.5 font-arcade text-base pointer-coarse:min-h-11 sm:w-[calc(4rem*var(--text-scale,1))] sm:text-sm pointer-coarse:sm:w-[calc(5rem*var(--text-scale,1))] pointer-coarse:sm:text-base text-electric text-glow-blue focus:border-electric focus:outline-none"
          @focus="enabled = true"
        />
        <span class="font-arcade text-[0.625rem] text-electric">x</span>
      </label>
      <!-- Presets scroll sideways when the row is tight, like the bet amount chips. -->
      <div data-scroll-x class="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="p in presets"
        :key="p"
        type="button"
        :aria-label="`Set auto cash out to ${p}x`"
        :aria-pressed="enabled && target === p"
        :class="[
          'clip-hud shrink-0 border px-1.5 py-0.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11 font-arcade text-[0.5rem] transition-colors',
          enabled && target === p
            ? 'border-electric text-electric'
            : 'border-violet/40 text-muted-foreground hover:border-electric hover:text-electric',
        ]"
        @click="((target = p), (enabled = true))"
      >
        {{ p }}x
      </button>
      <button
        type="button"
        :aria-pressed="isCustom"
        :class="[
          'clip-hud shrink-0 border px-1.5 py-0.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11 font-arcade text-[0.5rem] uppercase transition-colors',
          isCustom
            ? 'border-electric text-electric'
            : 'border-violet/40 text-muted-foreground hover:border-electric hover:text-electric',
        ]"
        @click="pickCustom"
      >
        {{ en.bet.custom }}
      </button>
      </div>
    </div>

    <p v-if="props.error" class="mt-1 text-xs text-danger">{{ props.error }}</p>
  </fieldset>
</template>
