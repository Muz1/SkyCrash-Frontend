<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import type { SkinId } from "@/lib/skyEnvironments";
import SkyEnvironment from "./SkyEnvironment.vue";
import Ambient from "./Ambient.vue";
import PageTransition from "./PageTransition.vue";
import CRTOverlay from "./CRTOverlay.vue";
import CreditDisplay from "./CreditDisplay.vue";
import Wordmark from "./Wordmark.vue";
import NavDock from "./NavDock.vue";
import MuteButton from "./MuteButton.vue";

withDefaults(
  defineProps<{ skin?: SkinId; dim?: number; showHud?: boolean }>(),
  { skin: "sunset-runway", dim: 0.45, showHud: true },
);

const auth = useAuthStore();
const credits = computed(() => auth.player?.creditBalance ?? 0);
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <SkyEnvironment :skin="skin" :dim="dim" />
    <Ambient :skin="skin" />
    <PageTransition />
    <CRTOverlay />
    <header v-if="showHud" class="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
      <div class="min-w-0">
        <Wordmark compact />
      </div>
      <div class="flex items-center gap-2 justify-self-end">
        <MuteButton />
        <CreditDisplay :credits="credits" />
      </div>
    </header>
    <main class="relative z-10 px-4 pb-40 sm:px-8">
      <slot />
    </main>
    <NavDock />
  </div>
</template>
