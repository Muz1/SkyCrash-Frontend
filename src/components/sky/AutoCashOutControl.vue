<script setup lang="ts">
import { computed } from 'vue'
import { Zap } from '@lucide/vue'

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
}>()

const PRESETS = [1.5, 2, 3, 5, 10]
const shown = computed(() => (Number.isFinite(target.value) ? target.value : 0))
</script>

<template>
  <!-- Live bet: show what's actually armed on the server. -->
  <div
    v-if="props.locked"
    :class="[
      'clip-hud flex min-w-[13rem] flex-1 items-center gap-2 border-2 px-3 py-2',
      props.armedTarget
        ? 'border-electric bg-electric/10 [box-shadow:var(--glow-blue)]'
        : 'border-violet/40 bg-void/60',
    ]"
    role="status"
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
      <p class="text-xs text-muted-foreground">
        {{
          props.armedTarget
            ? 'Cashes out for you when the plane reaches it.'
            : 'Press CASH OUT yourself this flight.'
        }}
      </p>
    </div>
  </div>

  <fieldset
    v-else
    :class="[
      'clip-hud min-w-[13rem] flex-1 border-2 px-3 py-2 transition-all',
      enabled
        ? 'border-electric bg-electric/10 [box-shadow:var(--glow-blue)]'
        : 'border-violet/50 bg-void/60',
    ]"
  >
    <legend class="sr-only">Auto Cash Out</legend>
    <div class="flex items-center gap-2">
      <Zap
        :class="['h-4 w-4 shrink-0', enabled ? 'text-electric' : 'text-muted-foreground']"
        aria-hidden="true"
      />
      <span
        class="font-arcade text-[0.5rem] uppercase tracking-[0.2em]"
        :class="enabled ? 'text-electric' : 'text-foreground'"
        >Auto Cash Out</span
      >
      <button
        type="button"
        role="switch"
        :aria-checked="enabled"
        aria-label="Auto Cash Out"
        :class="[
          'ml-auto flex items-center gap-1.5 border-2 px-1 py-0.5 font-arcade text-[0.5rem] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric',
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
    </div>

    <div class="mt-1.5 flex flex-wrap items-center gap-2.5">
      <label class="flex items-center gap-1">
        <span class="sr-only">Auto cash out target multiplier</span>
        <input
          v-model.number="target"
          type="number"
          inputmode="decimal"
          min="1.01"
          step="0.05"
          class="block w-20 border-2 border-violet/50 bg-void/70 px-2 py-0.5 font-arcade text-sm text-electric text-glow-blue focus:border-electric focus:outline-none"
          @focus="enabled = true"
        />
        <span class="font-arcade text-[0.625rem] text-electric">x</span>
      </label>
      <button
        v-for="p in PRESETS"
        :key="p"
        type="button"
        :aria-label="`Set auto cash out to ${p}x`"
        :class="[
          'clip-hud border px-1.5 py-0.5 font-arcade text-[0.5rem] transition-colors',
          enabled && target === p
            ? 'border-electric text-electric'
            : 'border-violet/40 text-muted-foreground hover:border-electric hover:text-electric',
        ]"
        @click="((target = p), (enabled = true))"
      >
        {{ p }}x
      </button>
    </div>

    <p v-if="props.error" class="mt-1 text-xs text-danger">{{ props.error }}</p>
    <p
      v-else
      class="mt-1 text-xs"
      :class="enabled ? 'text-foreground/85' : 'text-muted-foreground'"
    >
      {{
        enabled
          ? `On: cashes out for you at ${shown.toFixed(2)}x, even if you don't press CASH OUT.`
          : 'Off: you press CASH OUT yourself.'
      }}
    </p>
  </fieldset>
</template>
