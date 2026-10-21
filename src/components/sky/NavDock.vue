<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Home, Trophy, Warehouse, Plane, Coins, UserRound, Medal, ChevronUp, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/cn'
import { useHangarStore } from '@/stores/hangarStore'
import { PHONE_SCREEN, useMediaQuery } from '@/composables/useMediaQuery'

const props = withDefaults(
  defineProps<{
    /**
     * Game screen: on phones (below 768px wide, or held sideways) the dock tucks away under
     * the bottom edge so the stage gets the room. A swipe up from the bottom edge, a tap on the bottom edge or a
     * tap on its handle brings it back; it hides again after a few seconds, or as soon as
     * the player taps the game. Wider screens always show it.
     */
    autoHide?: boolean
  }>(),
  { autoHide: false },
)

const route = useRoute()
const hangarStore = useHangarStore()

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

/** The hangar tab pulses a few times while it holds a plane or sky the player hasn't seen yet. */
function glows(to: string) {
  return to === '/hangar' && hangarStore.hasNew && !isActive(to)
}

// ---------- auto-hide (phones, game screen only) ----------

const phone = useMediaQuery(PHONE_SCREEN)
const collapsible = computed(() => props.autoHide && phone.value)
const revealed = ref(false)
const hidden = computed(() => collapsible.value && !revealed.value)

/** How long the dock stays up after the last touch on it. */
const AUTO_HIDE_MS = 4000
/** Height of the bottom-edge zone where a swipe up (or a tap) brings the dock back. */
const EDGE_PX = 56
/** Upward travel that counts as a swipe rather than a wobbly tap. */
const SWIPE_PX = 24
const TAP_SLOP_PX = 10

const root = ref<HTMLElement | null>(null)
const handle = ref<HTMLButtonElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function cancelHide() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}
function scheduleHide() {
  cancelHide()
  // Never pull the dock away from under keyboard focus.
  if (root.value?.contains(document.activeElement) && document.activeElement !== handle.value) return
  hideTimer = setTimeout(() => {
    hideTimer = null
    hide()
  }, AUTO_HIDE_MS)
}
function reveal() {
  revealed.value = true
  scheduleHide()
}
function hide() {
  cancelHide()
  const active = document.activeElement
  const hadFocus = !!root.value?.contains(active) && active !== handle.value
  revealed.value = false
  // The links go inert while hidden, so hand focus to the handle instead of dropping it.
  if (hadFocus) void nextTick(() => handle.value?.focus())
}
function toggle() {
  if (revealed.value) hide()
  else reveal()
}

// One gesture at a time, from touch (iOS Safari, Android) or a mouse/pen pointer.
let gesture: { x: number; y: number } | null = null

function inBottomEdge(y: number) {
  return y >= window.innerHeight - EDGE_PX
}
function isControl(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button, a, input, select, textarea, label, [role="button"]')
}

function gestureStart(x: number, y: number, target: EventTarget | null) {
  if (!collapsible.value) return
  if (revealed.value) {
    // Using the dock keeps it up; touching anywhere else (the game) tucks it away.
    if (target instanceof Node && root.value?.contains(target)) scheduleHide()
    else hide()
    gesture = null
    return
  }
  gesture = inBottomEdge(y) ? { x, y } : null
}
function gestureMove(x: number, y: number) {
  if (!gesture) return
  const up = gesture.y - y
  if (up > SWIPE_PX && up > Math.abs(x - gesture.x)) {
    gesture = null
    reveal()
  }
}
function gestureEnd(x: number, y: number, target: EventTarget | null) {
  if (!gesture) return
  const moved = Math.hypot(x - gesture.x, y - gesture.y)
  gesture = null
  // A plain tap on the bottom edge reveals it too (the handle handles its own clicks).
  if (moved < TAP_SLOP_PX && !isControl(target)) reveal()
}

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (t && e.touches.length === 1) gestureStart(t.clientX, t.clientY, e.target)
  else gesture = null
}
function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (t) gestureMove(t.clientX, t.clientY)
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (t) gestureEnd(t.clientX, t.clientY, e.target)
}
function onTouchCancel() {
  gesture = null
}
// Touch input is handled by the touch events above (pointer events would double it up).
function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'touch') gestureStart(e.clientX, e.clientY, e.target)
}
function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'touch' && e.buttons) gestureMove(e.clientX, e.clientY)
}
function onPointerUp(e: PointerEvent) {
  if (e.pointerType !== 'touch') gestureEnd(e.clientX, e.clientY, e.target)
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && collapsible.value && revealed.value) hide()
}
function onFocusIn() {
  if (collapsible.value && document.activeElement !== handle.value) cancelHide()
}
function onFocusOut(e: FocusEvent) {
  if (collapsible.value && revealed.value && !root.value?.contains(e.relatedTarget as Node | null)) scheduleHide()
}

// Listeners are passive: they only watch, so scrolling and taps behave exactly as before.
const passive = { passive: true } as const
onMounted(() => {
  window.addEventListener('touchstart', onTouchStart, passive)
  window.addEventListener('touchmove', onTouchMove, passive)
  window.addEventListener('touchend', onTouchEnd, passive)
  window.addEventListener('touchcancel', onTouchCancel, passive)
  window.addEventListener('pointerdown', onPointerDown, passive)
  window.addEventListener('pointermove', onPointerMove, passive)
  window.addEventListener('pointerup', onPointerUp, passive)
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  cancelHide()
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchCancel)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('keydown', onKeyDown)
})

// A new page, or resizing past phone size, starts with the dock tucked away again.
watch([() => route.path, collapsible], () => {
  cancelHide()
  revealed.value = false
})
</script>

<template>
  <!-- In-flow bottom row of the page (never overlaid) everywhere except the phone game
       screen, where it becomes a sheet that slides up over the controls. -->
  <div
    ref="root"
    :class="
      collapsible
        ? cn(
            'fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            hidden ? 'translate-y-full' : 'translate-y-0',
          )
        : 'relative z-30 shrink-0'
    "
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <!-- The grab tab: sits on the bottom edge while hidden, on top of the sheet while shown. -->
    <button
      v-if="collapsible"
      ref="handle"
      type="button"
      data-dock-handle
      :aria-label="hidden ? 'Show navigation' : 'Hide navigation'"
      :aria-expanded="!hidden"
      aria-controls="nav-dock"
      class="group absolute bottom-full left-1/2 flex h-11 w-24 items-end justify-center focus-visible:outline-none"
      :style="{
        transform: hidden
          ? 'translate(-50%, calc(-1 * env(safe-area-inset-bottom, 0px)))'
          : 'translate(-50%, 0)',
      }"
      @click="toggle"
    >
      <span
        class="flex h-6 w-16 items-center justify-center border-2 border-b-0 border-magenta/70 bg-void/90 text-magenta [box-shadow:var(--glow-magenta)] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)] group-focus-visible:border-electric group-focus-visible:text-electric"
        aria-hidden="true"
      >
        <component :is="hidden ? ChevronUp : ChevronDown" class="h-4 w-4" />
      </span>
    </button>

    <nav
      id="nav-dock"
      aria-label="Sky Crash navigation"
      :inert="hidden || undefined"
      :class="
        cn(
          'flex justify-center px-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 min-[360px]:px-2 sm:pb-4',
          collapsible && 'border-t-2 border-magenta/50 bg-void/90 backdrop-blur-md',
        )
      "
    >
      <!-- 7 x 44px targets fit a 320px phone with no gaps; the gaps open up as room allows. -->
      <ul class="flex items-end gap-0 min-[360px]:gap-0.5 min-[400px]:gap-1 sm:gap-3">
        <li v-for="item in items" :key="item.to" :class="glows(item.to) ? 'hangar-glow' : undefined">
          <RouterLink
            :to="item.to"
            :aria-label="glows(item.to) ? `${item.label} (new planes or skies)` : item.label"
            :class="
              cn(
                'group grid place-items-center gap-1 border-2 transition-all duration-150 clip-hud',
                item.hero
                  ? 'h-14 w-11 border-[oklch(0.98_0.05_90)] bg-[image:var(--grad-sunset)] text-void [text-shadow:0_1px_0_color-mix(in_oklab,white_50%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] hover:brightness-125 min-[360px]:w-14 sm:h-[4.5rem] sm:w-[4.5rem]'
                  : 'h-11 w-11 border-violet/60 bg-void/70 text-muted-foreground hover:border-electric hover:text-electric hover:[box-shadow:var(--glow-blue)] min-[400px]:w-12 sm:h-14 sm:w-16',
                glows(item.to) && !isActive(item.to) ? 'border-lime text-lime' : '',
                isActive(item.to) ? '!border-magenta !text-magenta [box-shadow:var(--glow-magenta)]' : '',
              )
            "
          >
            <component :is="item.icon" :class="item.hero ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-4 w-4'" aria-hidden="true" />
            <span class="font-arcade text-[0.375rem] uppercase leading-none sm:text-[0.4375rem]">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
