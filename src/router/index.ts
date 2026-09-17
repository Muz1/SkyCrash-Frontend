import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { useAuthStore } from '../stores/AuthStore'
import ProfileView from '../views/ProfileView.vue'
import LobbyView from '../views/LobbyView.vue'
import WalletView from '../views/WalletView.vue'
import GameView from '../views/GameView.vue'
import HistoryView from '../views/HistoryView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'
import OperationsView from '../views/OperationsView.vue'
import { usePlayerStore } from '../stores/playerStore'
import RtpView from '../views/RtpView.vue'
import VolatilityView from '../views/VolatilityView.vue'
import AdminView from '../views/AdminView.vue'
import AdminCurrentRoundView from '../views/AdminCurrentRoundView.vue'
import AdminReportsView from '../views/AdminReportsView.vue'
import HangarView from '../views/HangarView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/lobby', name: 'lobby', component: LobbyView, meta: { requiresAuth: true } },
    { path: '/wallet', name: 'wallet', component: WalletView, meta: { requiresAuth: true } },
    { path: '/game', name: 'game', component: GameView, meta: { requiresAuth: true } },
    { path: '/hangar', name: 'hangar', component: HangarView, meta: { requiresAuth: true } },
    { path: '/history', name: 'history', component: HistoryView, meta: { requiresAuth: true } },
    {
      path: '/volatility',
      name: 'volatility',
      component: VolatilityView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/ops',
      name: 'operations',
      component: OperationsView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/rtp',
      name: 'rtp',
      component: RtpView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/rounds',
      name: 'admin-rounds',
      component: AdminCurrentRoundView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: AdminReportsView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    const playerStore = usePlayerStore()
    // A fresh page load (deep link, reload) mounts a brand-new Pinia store,
    // so the profile (and its isAdmin flag) needs loading before any guard
    // below - or any HUD relying on it - can see it.
    if (!playerStore.profile) {
      try {
        await playerStore.fetchProfile()
      } catch {
        // Stale/invalid token: let the axios 401 interceptor and the next
        // authenticated request clear the session instead of blocking here.
      }
    }
  }

  if (to.meta.requiresAdmin) {
    const playerStore = usePlayerStore()
    if (!playerStore.profile?.isAdmin) {
      return { name: 'home' }
    }
  }
})

export default router
