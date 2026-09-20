<script setup lang="ts">
import { Home, Plane, Trophy, Warehouse, UserRound, Coins } from "@lucide/vue";

const items = [
  { to: "/", label: "Home", icon: Home, hero: false },
  { to: "/leaderboard", label: "Ranks", icon: Trophy, hero: false },
  { to: "/hangar", label: "Hangar", icon: Warehouse, hero: false },
  { to: "/play", label: "Play", icon: Plane, hero: true },
  { to: "/history", label: "Flights", icon: Coins, hero: false },
  { to: "/profile", label: "Pilot", icon: UserRound, hero: false },
] as const;
</script>

<template>
  <nav
    aria-label="Sky Crash navigation"
    class="fixed inset-x-0 bottom-0 z-30 flex justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
  >
    <ul class="flex items-end gap-1.5 sm:gap-3">
      <li v-for="item in items" :key="item.to">
        <RouterLink
          :to="item.to"
          :aria-label="item.label"
          active-class="!border-magenta !text-magenta [box-shadow:var(--glow-magenta)]"
          class="group grid place-items-center gap-1 border-2 transition-all duration-150 clip-hud"
          :class="
            item.hero
              ? 'h-16 w-16 border-[oklch(0.98_0.05_90)] bg-[image:var(--grad-sunset)] text-void [text-shadow:0_1px_0_color-mix(in_oklab,white_50%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] hover:brightness-125 sm:h-20 sm:w-20'
              : 'h-12 w-12 border-violet/60 bg-void/70 text-muted-foreground hover:border-electric hover:text-electric hover:[box-shadow:var(--glow-blue)] sm:h-14 sm:w-16'
          "
        >
          <component :is="item.icon" :class="item.hero ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-4 w-4'" aria-hidden="true" />
          <span class="font-arcade text-[6px] uppercase leading-none sm:text-[7px]">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
