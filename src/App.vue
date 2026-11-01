<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useSignalRConnection } from '@/composables/useSignalRConnection'
import { useAudioStore } from '@/stores/audioStore'
import { soundEngine } from '@/lib/soundEngine'
import ToastStack from '@/components/sky/ToastStack.vue'
import BadgeViewer from '@/components/sky/BadgeViewer.vue'
import { en } from '@/copy/en'

useSignalRConnection()

const route = useRoute()
const audioStore = useAudioStore()

// The soundtrack belongs to the player app; the admin console stays quiet.
const ADMIN_PREFIXES = ['/admin', '/ops', '/rtp', '/volatility']
const isPlayerRoute = computed(() => !ADMIN_PREFIXES.some((p) => route.path.startsWith(p)))
watch(
  isPlayerRoute,
  (player) => {
    audioStore.musicAllowed = player
  },
  { immediate: true },
)

// Browsers only allow audio after a user gesture, so the engine starts on the
// first tap/click/keypress anywhere in the app.
// Mobile browsers (iOS especially) may refuse the first attempt, so every gesture retries
// until audio is actually running; 'click' and 'touchend' count as activation on iOS.
const GESTURES = ['pointerdown', 'pointerup', 'click', 'keydown', 'touchend'] as const
function unlockAudio() {
  soundEngine.unlock()
  if (soundEngine.unlocked) GESTURES.forEach((e) => window.removeEventListener(e, unlockAudio))
}
function onVisibility() {
  soundEngine.setPageVisible(document.visibilityState === 'visible')
}

onMounted(() => {
  GESTURES.forEach((e) => window.addEventListener(e, unlockAudio, { passive: true }))
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  GESTURES.forEach((e) => window.removeEventListener(e, unlockAudio))
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <RouterView />
  <!-- Helpline watermark on every player screen, in the bottom-left corner (the dock's bottom
       padding). Only the links take clicks; the phone game's slide-up dock (z-40) covers it. -->
  <p
    v-if="isPlayerRoute"
    class="pointer-events-none fixed bottom-[max(1px,calc(env(safe-area-inset-bottom)-10px))] left-[max(0.5rem,env(safe-area-inset-left))] z-[35] whitespace-nowrap font-sans text-[0.5625rem] font-semibold leading-none tracking-wide text-foreground/60"
  >
    {{ en.helpline.watermark }}:
    <a :href="en.helpline.tel" class="pointer-events-auto text-ember/90 underline-offset-2 hover:underline">{{ en.helpline.phone }}</a>
    ·
    <a :href="en.helpline.whatsappUrl" target="_blank" rel="noopener noreferrer" class="pointer-events-auto text-lime/90 underline-offset-2 hover:underline">WhatsApp<span class="hidden sm:inline"> {{ en.helpline.whatsapp }}</span></a>
    ·
    <a :href="en.helpline.url" target="_blank" rel="noopener noreferrer" class="pointer-events-auto text-electric/90 underline-offset-2 hover:underline"><span class="sm:hidden">Website</span><span class="hidden sm:inline">{{ en.helpline.site }}</span></a>
  </p>
  <ToastStack />
  <BadgeViewer />
</template>
