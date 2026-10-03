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
import InviteView from '../views/InviteView.vue'
import SpinWheelView from '../views/SpinWheelView.vue'
import HangarView from '../views/HangarView.vue'
import MissionsView from '../views/MissionsView.vue'
import TermsView from '../views/TermsView.vue'

const admin = { requiresAuth: true, requiresAdmin: true }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public landing page: everyone starts here; Play and the other player pages prompt a login.
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    // Readable by anyone; players who haven't agreed to the current version are sent here.
    { path: '/terms', name: 'terms', component: TermsView, meta: { anyRole: true } },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/lobby', name: 'lobby', component: LobbyView, meta: { requiresAuth: true } },
    { path: '/wallet', name: 'wallet', component: WalletView, meta: { requiresAuth: true } },
    { path: '/game', name: 'game', component: GameView, meta: { requiresAuth: true } },
    { path: '/hangar', name: 'hangar', component: HangarView, meta: { requiresAuth: true } },
    { path: '/missions', name: 'missions', component: MissionsView, meta: { requiresAuth: true } },
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
    // Admin invite links: open to anyone (the invitee may not have an account yet), and to
    // admins too (an admin can be invited to become a manager).
    { path: '/invite/:token', name: 'invite', component: InviteView, meta: { anyRole: true } },
    // The free-credits wheel: the only way to top up without buying credits.
    { path: '/spin', name: 'spin', component: SpinWheelView, meta: { requiresAuth: true } },

    // ---- admin dashboard (see AdminTabs.vue for the navigation) ----
    { path: '/admin', name: 'admin', component: () => import('../views/admin/AdminOverviewView.vue'), meta: admin },
    { path: '/admin/game-performance', name: 'admin-game-performance', component: () => import('../views/admin/AdminGamePerformanceView.vue'), meta: admin },
    { path: '/admin/player-activity', name: 'admin-player-activity', component: () => import('../views/admin/AdminPlayerActivityView.vue'), meta: admin },
    { path: '/admin/lobby-analytics', name: 'admin-lobby-analytics', component: () => import('../views/admin/AdminLobbyAnalyticsView.vue'), meta: admin },
    { path: '/admin/retention', name: 'admin-retention', component: () => import('../views/admin/AdminRetentionView.vue'), meta: admin },
    { path: '/admin/player-insights', name: 'admin-player-insights', component: () => import('../views/admin/AdminPlayerInsightsView.vue'), meta: admin },
    { path: '/admin/revenue', name: 'admin-revenue', component: () => import('../views/admin/AdminRevenueView.vue'), meta: admin },
    { path: '/admin/feedback', name: 'admin-feedback', component: () => import('../views/admin/AdminFeedbackAnalyticsView.vue'), meta: admin },
    { path: '/admin/feedback/submissions', name: 'admin-feedback-submissions', component: () => import('../views/admin/AdminFeedbackSubmissionsView.vue'), meta: admin },
    { path: '/admin/feedback/keywords', name: 'admin-feedback-keywords', component: () => import('../views/admin/AdminFeedbackKeywordsView.vue'), meta: admin },
    { path: '/admin/advisor', name: 'admin-advisor', component: () => import('../views/admin/AdminAdvisorView.vue'), meta: admin },
    { path: '/admin/feedback/insights', name: 'admin-feedback-insights', component: () => import('../views/admin/AdminAiInsightsView.vue'), meta: admin },
    { path: '/admin/players', name: 'admin-players', component: AdminView, meta: admin },
    { path: '/admin/rounds', name: 'admin-rounds', component: AdminCurrentRoundView, meta: admin },
    { path: '/admin/lobbies', name: 'admin-lobbies', component: () => import('../views/admin/AdminLobbiesView.vue'), meta: admin },
    { path: '/admin/payments', name: 'admin-payments', component: () => import('../views/admin/AdminPaymentsView.vue'), meta: admin },
    { path: '/admin/audio', name: 'admin-audio', component: () => import('../views/admin/AdminAudioView.vue'), meta: admin },
    { path: '/admin/skins', name: 'admin-skins', component: () => import('../views/admin/AdminSkinUsageView.vue'), meta: admin },
    {
      // Invite admins, change roles, remove access. Managers only (also enforced server-side).
      path: '/admin/management',
      name: 'admin-management',
      component: () => import('../views/admin/AdminManagementView.vue'),
      meta: { ...admin, requiresManager: true },
    },
    // Older reports kept reachable by URL but no longer in the navigation.
    { path: '/admin/reports', name: 'admin-reports', component: AdminReportsView, meta: admin },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Come back to where they were heading (e.g. Play) once they've signed in.
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (authStore.isAuthenticated) {
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

  const isAdmin = authStore.isAuthenticated && !!usePlayerStore().profile?.isAdmin

  if (to.meta.requiresAdmin && !isAdmin) {
    return { name: 'home' }
  }

  if (to.meta.requiresManager && !usePlayerStore().profile?.isManager) {
    return { name: 'admin' }
  }

  // Admins operate the game but never play it: every player-facing page
  // (including the landing page and the auth screens) sends them to the console.
  if (isAdmin && !to.meta.requiresAdmin && !to.meta.anyRole) {
    return { name: 'admin' }
  }

  // Players agree to the current Terms of Service before using the game (the server also
  // refuses their bets until they have).
  if (to.meta.requiresAuth && usePlayerStore().profile?.hasAcceptedTerms === false) {
    return { name: 'terms', query: { redirect: to.fullPath } }
  }
})

export default router
