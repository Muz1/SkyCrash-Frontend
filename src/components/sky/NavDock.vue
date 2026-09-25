<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Home, Trophy, Warehouse, Plane, Coins, UserRound, Medal, ChevronUp, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/cn'
import { useNavDockStore } from '@/stores/navDockStore'

const route = useRoute()
const dock = useNavDockStore()

const items = [
  { to: '/', label: 'Home', icon: Home, hero: false },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy, hero: false },
  { to: '/hangar', label: 'Hangar', icon: Warehouse, hero: false },
  { to: '/game', label: 'Play', icon: Plane, hero: true },
  { to: '/missions', label: 'Missions', icon: Medal, hero: false },
  { to: '/history', label: 'Flights', icon: Coins, hero: false },
  { to: '/profile', label: 'Pilot', icon: UserRound, hero: false },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

/** Home keeps the dock permanently visible; every other page auto-hides it. */
const pinned = computed(() => route.path === '/')
const shown = computed(() => pinned.value || dock.revealed)

// Desktop (mouse/trackpad) gets taskbar-style edge reveal; touch devices get a tab.
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const finePointer = ref(false)
let media: MediaQueryList | null = null
const onMediaChange = (e: MediaQueryListEvent) => (finePointer.value = e.matches)

const root = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function cancelHide() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function scheduleHide(delay = 350) {
  if (hideTimer !== null) return
  hideTimer = setTimeout(() => {
    hideTimer = null
    dock.hide()
  }, delay)
}

const EDGE_PX = 10
const LEAVE_MARGIN_PX = 28

function onMouseMove(e: MouseEvent) {
  if (pinned.value || !finePointer.value) return
  if (e.clientY >= window.innerHeight - EDGE_PX) {
    cancelHide()
    dock.reveal()
    return
  }
  if (!dock.revealed || !root.value) return
  const top = root.value.getBoundingClientRect().top
  if (e.clientY < top - LEAVE_MARGIN_PX) scheduleHide()
  else cancelHide()
}

function onPointerDown(e: PointerEvent) {
  if (pinned.value || !dock.revealed || !root.value) return
  if (!root.value.contains(e.target as Node)) dock.hide()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && dock.revealed) dock.hide()
}

// Keyboard users tabbing into the dock should see it.
function onFocusIn() {
  if (!pinned.value) {
    cancelHide()
    dock.reveal()
  }
}
function onFocusOut(e: FocusEvent) {
  if (pinned.value || !root.value) return
  if (!root.value.contains(e.relatedTarget as Node | null) && finePointer.value) scheduleHide(150)
}

// Arriving on a new page always tucks the dock away again.
watch(
  () => route.path,
  () => {
    cancelHide()
    dock.hide()
  },
)

onMounted(() => {
  dock.hide()
  media =window.matchMedia?.(FINE_POINTER) ?? null
  finePointer.value = media?.matches ?? false
  media?.addEventListener('change', onMediaChange)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  cancelHide()
  media?.removeEventListener('change', onMediaChange)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('keydown', onKeyDown)
})

/** How much of the dock peeks out while hidden: a tab on touch, a hint line on desktop. */
const peek = computed(() => (finePointer.value ? 10 : 26))
const dockStyle = computed(() => ({
  transform: shown.value ? 'translate3d(0,0,0)' : `translate3d(0, calc(100% - ${peek.value}px), 0)`,
}))
</script>

<template>
  <div
    ref="root"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    :style="dockStyle"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @mouseenter="cancelHide"
  >
    <template v-if="!pinned">
      <!-- Desktop: slim glowing hint line; hovering the bottom edge (or clicking this) reveals the dock. -->
      <button
        v-if="finePointer"
        type="button"
        :aria-label="shown ? 'Hide navigation' : 'Show navigation'"
        :aria-expanded="shown"
        class="pointer-events-auto grid h-[10px] w-28 place-items-center"
        @click="dock.toggle()"
      >
        <span
          :class="
            cn(
              'block h-[3px] w-full rounded-full bg-magenta/70 transition-opacity duration-300 [box-shadow:var(--glow-magenta)]',
              shown ? 'opacity-0' : 'opacity-80',
            )
          "
        />
      </button>
      <!-- Touch: small arrow tab that toggles the dock. -->
      <button
        v-else
        type="button"
        :aria-label="shown ? 'Hide navigation' : 'Show navigation'"
        :aria-expanded="shown"
        class="pointer-events-auto grid h-[26px] w-14 place-items-center border-2 border-b-0 border-magenta/70 bg-void/85 text-magenta [box-shadow:var(--glow-magenta)] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]"
        @click="dock.toggle()"
      >
        <component :is="shown ? ChevronDown : ChevronUp" class="h-4 w-4" aria-hidden="true" />
      </button>
    </template>

    <nav
      aria-label="Sky Crash navigation"
      class="pointer-events-auto px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:pb-5"
    >
      <ul class="flex items-end gap-1 sm:gap-3">
        <li v-for="item in items" :key="item.to">
          <RouterLink
            :to="item.to"
            :aria-label="item.label"
            :class="
              cn(
                'group grid place-items-center gap-1 border-2 transition-all duration-150 clip-hud',
                item.hero
                  ? 'h-14 w-14 border-[oklch(0.98_0.05_90)] bg-[image:var(--grad-sunset)] text-void [text-shadow:0_1px_0_color-mix(in_oklab,white_50%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] hover:brightness-125 sm:h-20 sm:w-20'
                  : 'h-11 w-12 border-violet/60 bg-void/70 text-muted-foreground hover:border-electric hover:text-electric hover:[box-shadow:var(--glow-blue)] sm:h-14 sm:w-16',
                isActive(item.to) ? '!border-magenta !text-magenta [box-shadow:var(--glow-magenta)]' : '',
              )
            "
          >
            <component :is="item.icon" :class="item.hero ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-4 w-4'" aria-hidden="true" />
            <span class="font-arcade text-[6px] uppercase leading-none sm:text-[7px]">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
