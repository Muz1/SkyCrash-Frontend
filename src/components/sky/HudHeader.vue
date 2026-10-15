<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ShieldCheck,
  Users,
  Music,
  VolumeX,
  SlidersHorizontal,
  ShoppingCart,
  Menu,
  X,
  Wallet,
  LogIn,
  UserPlus,
} from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useAudioStore } from '@/stores/audioStore'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import { NARROW_SCREEN, useMediaQuery } from '@/composables/useMediaQuery'
import CreditDisplay from './CreditDisplay.vue'
import Wordmark from './Wordmark.vue'
import SoundSettings from './SoundSettings.vue'
import HudMenuItem from './HudMenuItem.vue'

/**
 * Top bar of every player page. Wide screens (768px+) show each button in a row. Phones keep
 * the logo and the credits in view and fold every other button into one menu; pages can
 * add their own rows to it through the `menu` slot (the game screen adds its sound and
 * how-to-play buttons there).
 */
defineSlots<{ menu?: (props: { close: () => void }) => unknown }>()

const route = useRoute()
const playerStore = usePlayerStore()
const authStore = useAuthStore()
const audioStore = useAudioStore()
const publicSettings = usePublicSettingsStore()
onMounted(() => void publicSettings.refresh())
/** "Buy credits" only shows for players, and only while an admin has payments switched on. */
const canBuy = computed(() => !playerStore.profile?.isAdmin && !!publicSettings.settings?.paymentsEnabled)

const narrow = useMediaQuery(NARROW_SCREEN)

// ---------- audio mixer popover ----------

const soundOpen = ref(false)
const soundTrigger = ref<HTMLButtonElement | null>(null)

async function closeSound() {
  soundOpen.value = false
  // Hand focus back to whichever button opened the mixer.
  await nextTick()
  ;(narrow.value ? menuTrigger.value : soundTrigger.value)?.focus()
}

// ---------- phone menu ----------

const menuOpen = ref(false)
const menuTrigger = ref<HTMLButtonElement | null>(null)
const menuPanel = ref<HTMLElement | null>(null)

async function openMenu() {
  soundOpen.value = false
  menuOpen.value = true
  await nextTick()
  menuPanel.value?.querySelector<HTMLElement>('a, button')?.focus()
}
function closeMenu({ restoreFocus = false } = {}) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (restoreFocus) void nextTick(() => menuTrigger.value?.focus())
}
function openSoundFromMenu() {
  closeMenu()
  soundOpen.value = true
}
function toggleMenu() {
  if (menuOpen.value) closeMenu({ restoreFocus: true })
  else void openMenu()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen.value) {
    e.stopPropagation()
    closeMenu({ restoreFocus: true })
  }
}
function onPointerDown(e: PointerEvent) {
  if (!menuOpen.value) return
  const target = e.target as Node | null
  if (target && !menuPanel.value?.contains(target) && !menuTrigger.value?.contains(target)) closeMenu()
}
/** Tabbing out of the menu closes it, like a native disclosure. */
function onMenuFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next && !menuPanel.value?.contains(next) && !menuTrigger.value?.contains(next)) closeMenu()
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('pointerdown', onPointerDown)
})
watch(() => route.fullPath, () => closeMenu())
watch(narrow, (isNarrow) => {
  if (!isNarrow) closeMenu()
})

// 44px on touch screens (phones and tablets); the compact 36px buttons only with a mouse.
const ICON_BUTTON =
  'grid h-11 w-11 shrink-0 place-items-center border-2 bg-void/70 clip-hud transition-all md:h-9 md:w-9 pointer-coarse:h-11 pointer-coarse:w-11'
</script>

<template>
  <header
    class="relative z-20 flex shrink-0 items-center justify-between gap-2 pb-2.5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.625rem,env(safe-area-inset-top))] sm:gap-3 sm:pb-4 sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))] sm:pt-[max(1rem,env(safe-area-inset-top))]"
  >
    <div class="min-w-0">
      <Wordmark compact />
    </div>

    <!-- Wide screens: every button in the bar. -->
    <div class="hidden shrink-0 items-center gap-2 md:flex">
      <button
        type="button"
        :aria-label="audioStore.musicEnabled ? 'Mute music' : 'Play music'"
        :aria-pressed="audioStore.musicEnabled"
        :title="audioStore.musicEnabled ? 'Mute music' : 'Play music'"
        :class="[
          ICON_BUTTON,
          audioStore.musicEnabled
            ? 'border-magenta/70 text-magenta hover:[box-shadow:var(--glow-magenta)]'
            : 'border-violet/50 text-muted-foreground hover:border-magenta hover:text-magenta',
        ]"
        @click="audioStore.toggleMusic()"
      >
        <Music v-if="audioStore.musicEnabled" class="h-4 w-4" aria-hidden="true" />
        <VolumeX v-else class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        ref="soundTrigger"
        type="button"
        data-sound-settings-trigger
        aria-label="Audio settings"
        title="Audio settings"
        aria-haspopup="dialog"
        :aria-expanded="soundOpen"
        aria-controls="sound-settings"
        :class="[
          ICON_BUTTON,
          soundOpen
            ? 'border-electric text-electric [box-shadow:var(--glow-blue)]'
            : 'border-electric/70 text-electric hover:[box-shadow:var(--glow-blue)]',
        ]"
        @click="soundOpen ? closeSound() : (soundOpen = true)"
      >
        <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
      </button>
      <template v-if="!authStore.isAuthenticated">
        <RouterLink
          to="/login"
          class="clip-hud grid place-items-center border-2 border-electric/70 bg-void/70 px-3 py-2 pointer-coarse:min-h-11 font-display text-[0.625rem] font-black uppercase tracking-[0.18em] text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
        >
          Login
        </RouterLink>
        <RouterLink
          to="/register"
          class="clip-hud grid place-items-center border-2 border-magenta/70 bg-void/70 px-3 py-2 pointer-coarse:min-h-11 font-display text-[0.625rem] font-black uppercase tracking-[0.18em] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
        >
          Create Account
        </RouterLink>
      </template>
      <template v-else>
        <RouterLink
          v-if="playerStore.profile?.isAdmin"
          to="/admin"
          aria-label="Admin"
          :class="[ICON_BUTTON, 'border-ember/70 text-ember hover:[box-shadow:var(--glow-ember)]']"
        >
          <ShieldCheck class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          to="/lobby"
          aria-label="Lobby"
          :class="[ICON_BUTTON, 'border-electric/70 text-electric hover:[box-shadow:var(--glow-blue)]']"
        >
          <Users class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          v-if="canBuy"
          to="/wallet#buy-credits"
          aria-label="Buy credits"
          title="Buy credits"
          class="clip-hud flex h-9 shrink-0 items-center gap-1.5 border-2 border-lime/70 pointer-coarse:h-11 bg-void/70 px-2.5 text-lime transition-all hover:[box-shadow:var(--glow-lime)]"
        >
          <ShoppingCart class="h-4 w-4" aria-hidden="true" />
          <span class="font-arcade text-[0.5rem] uppercase tracking-[0.15em]">Buy credits</span>
        </RouterLink>
        <RouterLink to="/wallet" aria-label="Wallet" class="transition-transform hover:-translate-y-0.5">
          <CreditDisplay :credits="playerStore.profile?.creditBalance ?? 0" />
        </RouterLink>
      </template>
    </div>

    <!-- Phones: credits (or Login) stay in view; everything else lives in one menu. -->
    <div class="flex shrink-0 items-center gap-2 md:hidden">
      <RouterLink
        v-if="authStore.isAuthenticated"
        to="/wallet"
        aria-label="Wallet"
        class="block min-h-11"
      >
        <CreditDisplay :credits="playerStore.profile?.creditBalance ?? 0" class="min-h-11" />
      </RouterLink>
      <RouterLink
        v-else
        to="/login"
        class="clip-hud grid min-h-11 place-items-center border-2 border-electric/70 bg-void/70 px-3 font-display text-[0.625rem] font-black uppercase tracking-[0.18em] text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
      >
        Login
      </RouterLink>
      <button
        ref="menuTrigger"
        type="button"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        :aria-expanded="menuOpen"
        aria-controls="hud-menu"
        :class="[
          ICON_BUTTON,
          menuOpen
            ? 'border-magenta text-magenta [box-shadow:var(--glow-magenta)]'
            : 'border-magenta/70 text-magenta hover:[box-shadow:var(--glow-magenta)]',
        ]"
        @click="toggleMenu"
      >
        <X v-if="menuOpen" class="h-5 w-5" aria-hidden="true" />
        <Menu v-else class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <nav
      v-if="menuOpen"
      id="hud-menu"
      ref="menuPanel"
      aria-label="Menu"
      class="neon-panel clip-hud absolute right-[max(1rem,env(safe-area-inset-right))] top-full z-50 max-h-[calc(100dvh-5rem)] w-[min(17rem,calc(100vw-2rem))] overflow-y-auto py-1 md:hidden"
      @focusout="onMenuFocusOut"
    >
      <ul class="divide-y divide-border/50">
        <HudMenuItem
          :pressed="audioStore.musicEnabled"
          :accent="audioStore.musicEnabled ? 'magenta' : 'violet'"
          @click="audioStore.toggleMusic()"
        >
          <template #icon>
            <Music v-if="audioStore.musicEnabled" class="h-4 w-4" aria-hidden="true" />
            <VolumeX v-else class="h-4 w-4" aria-hidden="true" />
          </template>
          {{ audioStore.musicEnabled ? 'Mute music' : 'Play music' }}
        </HudMenuItem>
        <HudMenuItem @click="openSoundFromMenu">
          <template #icon><SlidersHorizontal class="h-4 w-4" aria-hidden="true" /></template>
          Audio settings
        </HudMenuItem>
        <slot name="menu" :close="closeMenu" />
        <template v-if="!authStore.isAuthenticated">
          <HudMenuItem to="/login">
            <template #icon><LogIn class="h-4 w-4" aria-hidden="true" /></template>
            Login
          </HudMenuItem>
          <HudMenuItem to="/register" accent="magenta">
            <template #icon><UserPlus class="h-4 w-4" aria-hidden="true" /></template>
            Create Account
          </HudMenuItem>
        </template>
        <template v-else>
          <HudMenuItem v-if="playerStore.profile?.isAdmin" to="/admin" accent="ember">
            <template #icon><ShieldCheck class="h-4 w-4" aria-hidden="true" /></template>
            Admin
          </HudMenuItem>
          <HudMenuItem to="/lobby">
            <template #icon><Users class="h-4 w-4" aria-hidden="true" /></template>
            Lobby
          </HudMenuItem>
          <HudMenuItem v-if="canBuy" to="/wallet#buy-credits" accent="lime">
            <template #icon><ShoppingCart class="h-4 w-4" aria-hidden="true" /></template>
            Buy credits
          </HudMenuItem>
          <HudMenuItem to="/wallet" accent="ember">
            <template #icon><Wallet class="h-4 w-4" aria-hidden="true" /></template>
            Wallet
          </HudMenuItem>
        </template>
      </ul>
    </nav>

    <SoundSettings
      v-if="soundOpen"
      id="sound-settings"
      class="absolute right-[max(1rem,env(safe-area-inset-right))] top-full z-40 sm:right-8"
      @close="closeSound"
    />
  </header>
</template>
