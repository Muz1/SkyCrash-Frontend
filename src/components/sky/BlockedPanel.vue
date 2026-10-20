<script setup lang="ts">
import { ShieldBan } from '@lucide/vue'
import AppealForm from './AppealForm.vue'
import ArcadeButton from './ArcadeButton.vue'
import type { BlockedLogin } from '@/types'
import { dateShort } from '@/lib/format'
import { en } from '@/copy/en'

/** What a blocked login shows: the rule, when it ends (or "Permanent"), and an appeal box if allowed. */
const props = defineProps<{ block: BlockedLogin }>()
const emit = defineEmits<{ back: [] }>()
const t = en.blocked
</script>

<template>
  <section class="neon-panel clip-hud crt-scan border-2 border-danger p-6 sm:p-8" aria-labelledby="blocked-title">
    <div class="flex items-center gap-3">
      <ShieldBan class="h-8 w-8 shrink-0 text-danger" aria-hidden="true" />
      <h1 id="blocked-title" class="font-display text-xl font-black uppercase tracking-[0.18em] text-danger">{{ t.title }}</h1>
    </div>

    <dl v-if="props.block.sanction" class="mt-5 space-y-3">
      <div>
        <dt class="font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.rule }}</dt>
        <dd class="mt-0.5 text-base font-semibold text-foreground">
          <span class="font-arcade text-[0.625rem] text-electric">{{ props.block.sanction.ruleCode }}</span>
          · {{ props.block.sanction.ruleTitle }}
        </dd>
        <dd class="text-sm text-foreground/80">{{ props.block.sanction.ruleSummary }}</dd>
      </div>
      <div>
        <dt class="font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.ends }}</dt>
        <dd class="mt-0.5 text-base font-semibold text-foreground">
          {{ props.block.sanction.endsAtUtc ? dateShort(props.block.sanction.endsAtUtc) : en.common.permanent }}
        </dd>
      </div>
    </dl>
    <p v-else class="mt-4 text-sm text-foreground/85">{{ props.block.message }}</p>

    <div class="mt-5 border-t border-violet/40 pt-4">
      <AppealForm
        v-if="props.block.sanction?.appealable && props.block.appealToken"
        :sanction-id="props.block.sanction.id"
        :appeal-token="props.block.appealToken"
        :pending="props.block.sanction.appealPending"
      />
      <p v-else class="text-sm text-muted-foreground">{{ t.notAppealable }}</p>
    </div>

    <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
      <ArcadeButton type="button" size="sm" variant="ghost" @click="emit('back')">{{ t.back }}</ArcadeButton>
      <RouterLink to="/rules" class="grid place-items-center text-sm font-semibold text-electric underline-offset-2 hover:underline pointer-coarse:min-h-11">
        {{ t.rulesLink }}
      </RouterLink>
    </div>
  </section>
</template>
