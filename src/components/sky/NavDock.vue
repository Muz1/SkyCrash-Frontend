<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Trophy, Warehouse, Plane, Coins, UserRound, Medal } from '@lucide/vue'
import { cn } from '@/lib/cn'
import { useHangarStore } from '@/stores/hangarStore'

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

/** The hangar tab lights up while a non-default plane or sky is equipped. */
function glows(to: string) {
  return to === '/hangar' && hangarStore.isCustomized
}
</script>

<template>
  <!-- Always-visible bottom row of each page's flex column (never fixed/overlaid, so nothing scrolls under it). -->
  <nav
    aria-label="Sky Crash navigation"
    class="relative z-30 flex shrink-0 justify-center px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 sm:pb-4"
  >
    <ul class="flex items-end gap-1 sm:gap-3">
      <li v-for="item in items" :key="item.to" :class="glows(item.to) ? 'hangar-glow' : undefined">
        <RouterLink
          :to="item.to"
          :aria-label="glows(item.to) ? `${item.label} (custom loadout equipped)` : item.label"
          :class="
            cn(
              'group grid place-items-center gap-1 border-2 transition-all duration-150 clip-hud',
              item.hero
                ? 'h-14 w-14 border-[oklch(0.98_0.05_90)] bg-[image:var(--grad-sunset)] text-void [text-shadow:0_1px_0_color-mix(in_oklab,white_50%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] hover:brightness-125 sm:h-[4.5rem] sm:w-[4.5rem]'
                : 'h-11 w-12 border-violet/60 bg-void/70 text-muted-foreground hover:border-electric hover:text-electric hover:[box-shadow:var(--glow-blue)] sm:h-14 sm:w-16',
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
</template>
