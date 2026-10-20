<script setup lang="ts">
import InfoTip from './InfoTip.vue'
import type { AccountRule } from '@/types'
import { actionLabel } from '@/lib/rulesPdf'
import { en } from '@/copy/en'

/** The Account rules, one line each: title and summary, with the full details behind ⓘ. */
defineProps<{ rules: AccountRule[] }>()
</script>

<template>
  <ul class="divide-y divide-violet/30">
    <li v-for="rule in rules" :key="rule.code" class="flex items-start gap-3 py-2.5">
      <span class="clip-hud mt-0.5 shrink-0 border border-electric/60 px-1.5 py-0.5 font-arcade text-[0.5rem] text-electric">
        {{ rule.code }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="font-display text-xs font-black uppercase tracking-[0.12em] text-foreground">{{ rule.title }}</p>
        <p class="text-sm text-foreground/85">{{ rule.summary }}</p>
      </div>
      <InfoTip :text="rule.details" :label="`${en.rules.details}: ${rule.code}`" align="right">
        <span class="mt-2 block text-xs text-muted-foreground">
          {{ actionLabel(rule) }}<template v-if="rule.appealable"> · {{ en.rules.appealable }}</template>
        </span>
      </InfoTip>
    </li>
  </ul>
</template>
