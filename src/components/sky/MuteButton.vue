<script setup lang="ts">
import { Volume2, VolumeX } from "@lucide/vue";
import { useSoundStore } from "@/stores/sound";

const sound = useSoundStore();

function toggle() {
  sound.toggleMute();
}
</script>

<template>
  <button
    type="button"
    :aria-label="sound.muted ? 'Unmute music' : 'Mute music'"
    :aria-pressed="sound.muted"
    class="neon-panel clip-hud grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-electric"
    @click="toggle"
  >
    <VolumeX v-if="sound.muted" class="h-4 w-4" aria-hidden="true" />
    <Volume2 v-else class="h-4 w-4" aria-hidden="true" />
  </button>
</template>
