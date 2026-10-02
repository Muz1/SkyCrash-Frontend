<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Gauge,
  Users,
  Boxes,
  Coins,
  Percent,
  ChartPie,
  MessagesSquare,
  Sparkles,
  Bot,
  Tags,
  UserCog,
  Radio,
  Armchair,
  Volume2,
  CreditCard,
  Palette,
  ShieldCheck,
} from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'

/** The admin dashboard's grouped navigation (sidebar on desktop, scrolling strip on mobile). */
const route = useRoute()
const playerStore = usePlayerStore()

const groups = computed(() => [
  { label: null, items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard }] },
  {
    label: 'Game Analytics',
    items: [
      { to: '/admin/game-performance', label: 'Game Performance', icon: Gauge },
      { to: '/admin/player-activity', label: 'Player Activity', icon: Users },
      { to: '/admin/lobby-analytics', label: 'Lobby Analytics', icon: Boxes },
    ],
  },
  {
    label: 'Revenue & Profit',
    items: [
      { to: '/admin/revenue', label: 'Revenue & Profit', icon: Coins },
      { to: '/rtp', label: 'RTP & House Edge', icon: Percent },
    ],
  },
  {
    label: 'Feedback',
    items: [
      { to: '/admin/feedback', label: 'Feedback Analytics', icon: ChartPie },
      { to: '/admin/feedback/submissions', label: 'Feedback Submissions', icon: MessagesSquare },
      { to: '/admin/feedback/insights', label: 'AI Insights', icon: Sparkles },
      { to: '/admin/feedback/keywords', label: 'Feedback Keywords', icon: Tags },
      { to: '/admin/advisor', label: 'AI Advisor', icon: Bot },
    ],
  },
  {
    label: 'Game Management',
    items: [
      { to: '/admin/players', label: 'Players', icon: UserCog },
      { to: '/admin/rounds', label: 'Live Round', icon: Radio },
      { to: '/admin/lobbies', label: 'Lobbies', icon: Armchair },
      { to: '/admin/audio', label: 'Audio', icon: Volume2 },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  { label: 'Cosmetics', items: [{ to: '/admin/skins', label: 'Skin Usage', icon: Palette }] },
  // Only managers can change who is an admin (enforced server-side too).
  ...(playerStore.profile?.isManager
    ? [{ label: null, items: [{ to: '/admin/management', label: 'Admin Management', icon: ShieldCheck }] }]
    : []),
])
</script>

<template>
  <nav class="adm-nav" aria-label="Admin dashboard">
    <div v-for="(group, gi) in groups" :key="gi" class="adm-nav-group">
      <p v-if="group.label" class="adm-nav-heading">{{ group.label }}</p>
      <RouterLink
        v-for="item in group.items"
        :key="item.to"
        :to="item.to"
        class="adm-nav-link"
        :aria-current="route.path === item.to ? 'page' : undefined"
      >
        <component :is="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
