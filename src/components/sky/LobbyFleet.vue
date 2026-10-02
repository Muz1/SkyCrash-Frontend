<script setup lang="ts">
import { computed } from 'vue'
import Aircraft from './Aircraft.vue'
import { LOBBY_CAPACITY, type LobbyMate } from '@/lib/lobby'

/**
 * Background aircraft for the pilots sharing your lobby: each one cruises
 * across the sky in its own lane with a call-sign tag. Purely decorative
 * (the member list carries the same info), and never more planes than a
 * lobby holds.
 */
const props = defineProps<{ mates: LobbyMate[] }>()

interface Lane {
  top: string
  size: number
  duration: number
  /** Seconds into the loop at mount, so the sky is already populated. */
  offset: number
  bob: number
  /** Where the plane parks when reduced motion is on. */
  rest: string
}

// Hand-placed so planes never stack: alternating high/low, varied speed.
const LANES: Lane[] = [
  { top: '14%', size: 96, duration: 38, offset: 6, bob: 9, rest: '6vw' },
  { top: '58%', size: 78, duration: 46, offset: 30, bob: 11, rest: '72vw' },
  { top: '30%', size: 66, duration: 54, offset: 14, bob: 13, rest: '40vw' },
  { top: '74%', size: 88, duration: 42, offset: 36, bob: 10, rest: '18vw' },
  { top: '8%', size: 60, duration: 60, offset: 44, bob: 12, rest: '58vw' },
  { top: '46%', size: 104, duration: 50, offset: 4, bob: 14, rest: '84vw' },
  { top: '66%', size: 58, duration: 64, offset: 22, bob: 9, rest: '48vw' },
  { top: '22%', size: 82, duration: 44, offset: 52, bob: 11, rest: '28vw' },
]

const flights = computed(() =>
  props.mates.slice(0, LOBBY_CAPACITY).map((mate, i) => ({ mate, lane: LANES[i % LANES.length]! })),
)
</script>

<template>
  <div aria-hidden class="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      v-for="{ mate, lane } in flights"
      :key="mate.playerId"
      class="lobby-fleet-lane absolute left-0"
      :style="{
        top: lane.top,
        animation: `ambient-cross ${lane.duration}s linear -${lane.offset}s infinite`,
        willChange: 'transform',
        '--fleet-rest-x': lane.rest,
      }"
    >
      <div class="flex flex-col items-center opacity-85" :style="{ animation: `ambient-bob ${lane.bob}s ease-in-out infinite` }">
        <Aircraft :craft="mate.craftId" :size="lane.size" :idle="false" :trail-intensity="0.45" />
        <span
          class="clip-hud -mt-2 max-w-[9rem] truncate border border-electric/70 bg-void/85 px-2 py-1 font-arcade text-[7px] uppercase text-foreground"
        >
          {{ mate.username }}
        </span>
      </div>
    </div>
  </div>
</template>
