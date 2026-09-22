<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/lib/cn'

const toastStore = useToastStore()

const accentClass: Record<string, string> = {
  lime: 'border-lime text-lime [box-shadow:var(--glow-lime)]',
  ember: 'border-ember text-ember [box-shadow:var(--glow-ember)]',
  magenta: 'border-magenta text-magenta [box-shadow:var(--glow-magenta)]',
  blue: 'border-electric text-electric [box-shadow:var(--glow-blue)]',
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="
          cn(
            'pointer-events-auto neon-panel clip-hud flex w-full max-w-sm items-center gap-3 border-2 bg-void/90 p-3',
            accentClass[toast.accent],
          )
        "
      >
        <img v-if="toast.imageSrc" :src="toast.imageSrc" alt="" class="h-10 w-10 shrink-0 object-contain" />
        <div class="min-w-0">
          <p class="font-display text-xs font-black uppercase tracking-[0.2em]">{{ toast.title }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
          @click="toastStore.dismiss(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 220ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
