<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Clock, Users } from '@lucide/vue'
import { useChallengeStore } from '@/stores/challengeStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { usePlayerStore } from '@/stores/playerStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'
import ChallengeBadgeIcon from '@/components/sky/ChallengeBadgeIcon.vue'
import { CHALLENGE_BADGES, challengeBadgeFor, SOCIAL_CHALLENGE_TYPES } from '@/lib/challengeBadges'
import { useCountdown, formatDuration } from '@/composables/useCountdown'

const challengeStore = useChallengeStore()
const achievementStore = useAchievementStore()
const playerStore = usePlayerStore()

onMounted(() => {
  challengeStore.fetchTodayChallenges()
  challengeStore.fetchBadges().catch(() => undefined)
  achievementStore.fetchAchievements()
})

const resetsAt = computed(() => challengeStore.challenges[0]?.resetsAtUtc ?? null)
const { seconds: resetSeconds } = useCountdown(resetsAt)

// Every challenge badge, earned or not, so players can see what's left to collect.
const collection = computed(() =>
  Object.keys(CHALLENGE_BADGES).map((key) => ({
    key,
    info: CHALLENGE_BADGES[key]!,
    earned: challengeStore.badges.find((b) => b.badgeKey === key) ?? null,
  })),
)
const earnedCount = computed(() => collection.value.filter((b) => b.earned).length)

function progressPercent(progress: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((progress / target) * 100))
}

function formatProgress(progress: number, target: number) {
  const round = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 100) / 100)
  return `${round(progress)}/${round(target)}`
}

async function toggleDisplayed(key: string, isDisplayed: boolean) {
  const nextKey = isDisplayed ? null : key
  await achievementStore.setDisplayed(nextKey)
  if (playerStore.profile) {
    playerStore.profile.displayedAchievementKey = nextKey
  }
}
</script>

<template>
  <Shell skin="deep-space" :dim="0.5">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-lime text-glow-lime sm:text-3xl">
        Missions
      </h1>

      <NeonPanel class="mt-6" title="Daily Challenges" accent="lime">
        <p v-if="resetsAt" class="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/85">
          <Clock class="h-4 w-4" aria-hidden="true" />
          Same for every pilot today. New rotation in {{ formatDuration(resetSeconds) }}
        </p>
        <p v-if="challengeStore.isLoading && challengeStore.challenges.length === 0" class="text-sm text-muted-foreground">
          Loading…
        </p>
        <ul v-else class="space-y-5">
          <li v-for="c in challengeStore.challenges" :key="c.id" class="flex gap-3">
            <ChallengeBadgeIcon :badge-key="c.badgeKey" size="md" :locked="!c.isCompleted" class="mt-0.5" />
            <div class="min-w-0 flex-1">
            <p class="font-arcade text-[8px] uppercase tracking-[0.2em] text-foreground/70">
              {{ c.track }} · {{ challengeBadgeFor(c.badgeKey)?.name }} badge
            </p>
            <div class="mt-1 flex items-center justify-between gap-2">
              <p class="font-display text-sm uppercase tracking-[0.12em] text-foreground">{{ c.description }}</p>
              <span class="shrink-0 font-arcade text-[9px] uppercase tracking-[0.2em] text-ember">
                +{{ c.rewardCredits.toLocaleString() }}
              </span>
            </div>
            <div class="mt-2 h-2 w-full overflow-hidden rounded-none border border-violet/40 bg-void/60">
              <div
                :class="c.isCompleted ? 'bg-lime [box-shadow:var(--glow-lime)]' : 'bg-electric [box-shadow:var(--glow-blue)]'"
                class="h-full transition-all duration-300"
                :style="{ width: `${progressPercent(c.progress, c.target)}%` }"
              />
            </div>
            <p class="mt-1 font-arcade text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {{ formatProgress(c.progress, c.target) }}
              <span v-if="c.isCompleted" class="ml-2 text-lime">Complete</span>
            </p>
            <RouterLink
              v-if="!c.isCompleted && SOCIAL_CHALLENGE_TYPES.has(c.type)"
              to="/lobby"
              class="mt-2 inline-flex items-center gap-1.5 font-arcade text-[8px] uppercase tracking-[0.2em] text-electric hover:text-foreground"
            >
              <Users class="h-3 w-3" aria-hidden="true" /> Open the lobby to invite friends
            </RouterLink>
            </div>
          </li>
          <li v-if="challengeStore.challenges.length === 0 && !challengeStore.isLoading" class="text-sm text-muted-foreground">
            No challenges available.
          </li>
        </ul>
      </NeonPanel>

      <NeonPanel class="mt-5" title="Challenge Badges" accent="blue">
        <p class="mb-4 text-sm text-foreground/85">
          {{ earnedCount }}/{{ collection.length }} collected. Complete a daily challenge to earn its badge; repeats stack up.
        </p>
        <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <li v-for="b in collection" :key="b.key" class="flex items-center gap-3">
            <ChallengeBadgeIcon :badge-key="b.key" size="md" :count="b.earned?.timesEarned ?? 0" :locked="!b.earned" />
            <div class="min-w-0">
              <p class="font-display text-xs uppercase tracking-[0.1em] text-foreground">{{ b.info.name }}</p>
              <p class="text-xs leading-snug text-muted-foreground">{{ b.info.description }}</p>
            </div>
          </li>
        </ul>
      </NeonPanel>

      <NeonPanel class="mt-5" title="Achievements" accent="ember">
        <p v-if="achievementStore.isLoading && achievementStore.achievements.length === 0" class="text-sm text-muted-foreground">
          Loading…
        </p>
        <ul v-else class="space-y-4">
          <li
            v-for="a in achievementStore.achievements"
            :key="a.key"
            class="flex items-center gap-3"
          >
            <AchievementBadge
              :achievement-key="a.key"
              :name="a.name"
              size="md"
              :class="a.unlocked ? '' : 'opacity-25 grayscale'"
            />
            <div class="min-w-0 flex-1">
              <p class="font-display text-sm uppercase tracking-[0.12em] text-foreground">{{ a.name }}</p>
              <p class="text-xs text-muted-foreground">{{ a.description }}</p>
              <div class="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden border border-violet/40 bg-void/60">
                <div
                  :class="a.unlocked ? 'bg-lime [box-shadow:var(--glow-lime)]' : 'bg-electric [box-shadow:var(--glow-blue)]'"
                  class="h-full transition-all duration-300"
                  :style="{ width: `${progressPercent(a.progress, a.target)}%` }"
                />
              </div>
              <p class="mt-1 font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {{ formatProgress(a.progress, a.target) }}
              </p>
            </div>
            <ArcadeButton
              v-if="a.unlocked"
              size="sm"
              :variant="a.isDisplayed ? 'ghost' : 'blue'"
              @click="toggleDisplayed(a.key, a.isDisplayed)"
            >
              {{ a.isDisplayed ? 'Remove Badge' : 'Display' }}
            </ArcadeButton>
          </li>
        </ul>
      </NeonPanel>
    </div>
  </Shell>
</template>
