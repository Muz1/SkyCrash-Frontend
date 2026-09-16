<script setup lang="ts">
import { watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useHangarStore } from "@/stores/hangar";
import { useRoundStore } from "@/stores/round";

const auth = useAuthStore();
const hangar = useHangarStore();
const round = useRoundStore();

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
</script>

<template>
  <RouterView />
</template>
