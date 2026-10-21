<script setup lang="ts">
import { useRouter } from 'vue-router'
import SkyModal from './SkyModal.vue'
import ArcadeButton from './ArcadeButton.vue'
import type { PlaySession } from '@/types'
import { signedCredits } from '@/lib/format'
import { en } from '@/copy/en'

/** The session reminder: time played and net result, then keep playing or take a break. */
const props = defineProps<{ session: PlaySession }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const t = en.responsible

function takeBreak() {
  emit('close')
  void router.push({ path: '/profile', hash: '#take-a-break' })
}
</script>

<template>
  <SkyModal :title="t.realityTitle" accent="ember" width="sm" @close="emit('close')">
    <dl class="grid grid-cols-2 gap-3">
      <div class="clip-hud border border-violet/40 bg-void/50 p-3">
        <dt class="font-arcade text-[0.4375rem] uppercase tracking-[0.2em] text-muted-foreground">{{ t.played }}</dt>
        <dd class="mt-1 font-arcade text-sm text-foreground">{{ t.minutes(props.session.minutesPlayed) }}</dd>
      </div>
      <div class="clip-hud border border-violet/40 bg-void/50 p-3">
        <dt class="font-arcade text-[0.4375rem] uppercase tracking-[0.2em] text-muted-foreground">{{ t.net }}</dt>
        <dd :class="['mt-1 font-arcade text-sm tabular-nums', props.session.netResult >= 0 ? 'text-lime' : 'text-danger']">
          {{ signedCredits(props.session.netResult) }}
        </dd>
      </div>
    </dl>
    <template #footer>
      <ArcadeButton type="button" size="md" variant="ghost" @click="takeBreak">{{ t.takeBreak }}</ArcadeButton>
      <ArcadeButton type="button" size="md" variant="cash" data-autofocus @click="emit('close')">{{ t.keepPlaying }}</ArcadeButton>
    </template>
  </SkyModal>
</template>
