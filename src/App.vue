<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useSignalRConnection } from '@/composables/useSignalRConnection'
import { useAudioStore } from '@/stores/audioStore'
import { soundEngine } from '@/lib/soundEngine'
import ToastStack from '@/components/sky/ToastStack.vue'
import BadgeViewer from '@/components/sky/BadgeViewer.vue'

useSignalRConnection()

const route = useRoute()
const audioStore = useAudioStore()

// The soundtrack belongs to the player app; the admin console stays quiet.
const ADMIN_PREFIXES = ['/admin', '/ops', '/rtp', '/volatility']
watch(
  () => route.path,
  (path) => {
    audioStore.musicAllowed = !ADMIN_PREFIXES.some((p) => path.startsWith(p))
  },
  { immediate: true },
)

// Browsers only allow audio after a user gesture, so the engine starts on the
// first tap/click/keypress anywhere in the app.
const GESTURES = ['pointerdown', 'keydown', 'touchend'] as const
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
  <ToastStack />
  <BadgeViewer />
</template>
