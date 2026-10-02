<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { X, RotateCw } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import logo from '@/assets/logo-skycrash.png'

/**
 * "Out of fuel" notice shown when a player can't cover the smallest bet. The wheel itself
 * lives on its own page (/spin), the game's only source of free credits.
 */
withDefaults(defineProps<{ outOfCredits?: boolean }>(), { outOfCredits: true })
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const root = ref<HTMLElement | null>(null)

function goToWheel() {
  emit('close')
  router.push('/spin')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed inset-0 z-[85] grid place-items-center bg-[oklch(0.08_0.04_285/0.82)] p-4 backdrop-blur-sm">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fuel-title"
      class="clip-hud relative w-[min(26rem,100%)] border-2 border-ember bg-void p-6 text-center text-foreground [box-shadow:var(--glow-ember)]"
    >
      <button
        type="button"
        aria-label="Close"
        class="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
      <div class="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-ember bg-deep p-3 [box-shadow:var(--glow-ember)]">
        <img :src="logo" alt="" class="w-full object-contain" />
      </div>
      <h2 id="fuel-title" class="mt-4 font-display text-xl font-black uppercase tracking-[0.18em] text-ember">
        {{ outOfCredits ? 'Out of fuel!' : 'Free credits' }}
      </h2>
      <p class="mt-2 text-base leading-relaxed text-foreground/90">
        {{ outOfCredits ? "You don't have enough credits for a bet." : 'Need more credits?' }} Spin the Sky Crash wheel to refuel.
      </p>
      <div class="mt-5 flex flex-col gap-3">
        <ArcadeButton size="lg" data-autofocus @click="goToWheel"><RotateCw class="h-5 w-5" aria-hidden="true" /> Spin the wheel</ArcadeButton>
        <ArcadeButton variant="ghost" @click="emit('close')">Not now</ArcadeButton>
      </div>
    </div>
  </div>
</template>
