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
  <div role="status" aria-live="polite" class="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4">
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
        <RouterLink
          v-if="toast.action"
          :to="toast.action.to"
          class="ml-auto grid shrink-0 place-items-center border-2 border-current px-2 py-1 font-arcade text-[0.5rem] uppercase tracking-[0.15em] pointer-coarse:min-h-11 hover:bg-foreground/10"
          @click="toastStore.dismiss(toast.id)"
        >
          {{ toast.action.label }}
        </RouterLink>
        <button
          type="button"
          :class="cn('grid shrink-0 place-items-center text-muted-foreground hover:text-foreground pointer-coarse:h-11 pointer-coarse:w-11', !toast.action && 'ml-auto')"
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
