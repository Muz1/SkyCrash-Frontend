<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useHangarStore } from "@/stores/hangar";
import { useRoundStore } from "@/stores/round";
import { useSoundStore } from "@/stores/sound";

const auth = useAuthStore();
const hangar = useHangarStore();
const round = useRoundStore();
const sound = useSoundStore();

watch(
  () => auth.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      hangar.fetchLoadout().catch(() => undefined);
      round.connect();
    } else {
      round.disconnect();
    }
  },
  { immediate: true },
);

// Browsers block audio playback until the user has interacted with the page.
function primeAudioOnce() {
  sound.primeAudio();
  window.removeEventListener("pointerdown", primeAudioOnce);
  window.removeEventListener("keydown", primeAudioOnce);
}

onMounted(() => {
  window.addEventListener("pointerdown", primeAudioOnce);
  window.addEventListener("keydown", primeAudioOnce);
});

onUnmounted(() => {
  window.removeEventListener("pointerdown", primeAudioOnce);
  window.removeEventListener("keydown", primeAudioOnce);
});
</script>

<template>
  <RouterView />
</template>
