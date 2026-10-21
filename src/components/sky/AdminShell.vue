<script lang="ts">
/** Sidebar scroll position, kept across admin pages. */
const sidebarScroll = { top: 0, left: 0 }
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Menu, Moon, Sun, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useMediaQuery } from '@/composables/useMediaQuery'
import logo from '@/assets/logo-skycrash.png'
import AdminTabs from './AdminTabs.vue'
import HelpTip from './HelpTip.vue'
import '@/components/admin/admin.css'
import { useHouseLossAlert } from '@/composables/useHouseLossAlert'
import { cr } from '@/lib/reportFormat'
import { admin as copy } from '@/copy/admin'

defineProps<{ helpText?: string }>()

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

const adminName = computed(() => authStore.username ?? playerStore.profile?.username ?? 'Admin')
const initial = computed(() => adminName.value.charAt(0).toUpperCase())
const roleLabel = computed(() => (playerStore.profile?.isManager ? 'Manager' : 'Administrator'))

// The dashboard is light grey by default; admins can switch to the dark console. Per-browser.
const THEME_KEY = 'skycrash_admin_theme_v2'
function initialTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}
const theme = ref<'light' | 'dark'>(initialTheme())
watch(theme, (value) => {
  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    // Not persisted; the toggle still works for this page view.
  }
})

// Every admin page renders its own AdminShell, so the sidebar is rebuilt on each navigation.
// Remember how far it was scrolled (module-level, shared by all instances) and put it back,
// so picking a report lower down the menu doesn't jump the menu back to the top.
const sidebar = ref<HTMLElement | null>(null)
const houseLoss = useHouseLossAlert()
onMounted(() => {
  houseLoss.listen()
  if (!sidebar.value) return
  sidebar.value.scrollTop = sidebarScroll.top
  sidebar.value.scrollLeft = sidebarScroll.left
})
function rememberSidebarScroll() {
  if (!sidebar.value) return
  sidebarScroll.top = sidebar.value.scrollTop
  sidebarScroll.left = sidebar.value.scrollLeft
}
onBeforeUnmount(rememberSidebarScroll)

// ---------- menu drawer (below 1024px the sidebar slides in from the left) ----------

const isDrawer = useMediaQuery('(max-width: 1023.98px)')
const drawerOpen = ref(false)
const menuToggle = ref<HTMLButtonElement | null>(null)
const drawerClose = ref<HTMLButtonElement | null>(null)

async function openDrawer() {
  drawerOpen.value = true
  await nextTick()
  // Start on the current page's link so the admin sees where they are.
  const current = sidebar.value?.querySelector<HTMLElement>('[aria-current="page"]')
  ;(current ?? drawerClose.value)?.focus()
}
function closeDrawer() {
  if (!drawerOpen.value) return
  drawerOpen.value = false
  void nextTick(() => menuToggle.value?.focus())
}
function onDrawerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeDrawer()
    return
  }
  // Keep Tab inside the open drawer (it is a modal dialog).
  if (e.key !== 'Tab' || !sidebar.value) return
  const focusable = [...sidebar.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
// Growing past tablet width turns the drawer back into the always-visible sidebar.
watch(isDrawer, (drawer) => {
  if (!drawer) drawerOpen.value = false
})

function handleLogout() {
  authStore.logout()
  playerStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="admin-console flex h-dvh flex-col overflow-hidden" :data-theme="theme">
    <header class="adm-topbar">
      <div class="adm-brand">
        <button
          ref="menuToggle"
          type="button"
          class="adm-menu-toggle"
          aria-controls="adm-sidebar"
          :aria-expanded="drawerOpen"
          aria-haspopup="dialog"
          @click="drawerOpen ? closeDrawer() : openDrawer()"
        >
          <Menu aria-hidden="true" />
          <span>Menu</span>
        </button>
        <img :src="logo" alt="Sky Crash" width="1152" height="576" />
        <span class="adm-brand-divider" aria-hidden="true" />
        <span class="adm-brand-label">Admin Dashboard</span>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <HelpTip v-if="helpText" :text="helpText" />
        <div class="adm-user">
          <span class="adm-avatar" aria-hidden="true">{{ initial }}</span>
          <div class="hidden sm:block">
            <p class="adm-user-name">{{ adminName }}</p>
            <p class="adm-user-role">{{ roleLabel }}</p>
          </div>
        </div>
        <button
          type="button"
          class="adm-theme-toggle"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          :title="theme === 'dark' ? 'Light theme' : 'Dark theme'"
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
        >
          <Sun v-if="theme === 'dark'" aria-hidden="true" />
          <Moon v-else aria-hidden="true" />
        </button>
        <button type="button" class="adm-btn adm-btn--ghost" aria-label="Logout" @click="handleLogout">
          <LogOut aria-hidden="true" /> <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>

    <div class="adm-layout">
      <!-- Sidebar on desktop; a modal drawer below 1024px (hidden, and out of the tab order, until opened). -->
      <aside
        id="adm-sidebar"
        ref="sidebar"
        :class="['adm-sidebar', drawerOpen && 'is-open']"
        :role="isDrawer ? 'dialog' : undefined"
        :aria-modal="isDrawer ? 'true' : undefined"
        :aria-label="isDrawer ? 'Admin dashboard menu' : undefined"
        @scroll.passive="rememberSidebarScroll"
        @keydown="isDrawer && onDrawerKeydown($event)"
      >
        <div class="adm-drawer-head">
          <div class="adm-drawer-user">
            <span class="adm-avatar" aria-hidden="true">{{ initial }}</span>
            <div>
              <p class="adm-user-name">{{ adminName }}</p>
              <p class="adm-user-role">{{ roleLabel }}</p>
            </div>
          </div>
          <button ref="drawerClose" type="button" class="adm-theme-toggle" aria-label="Close menu" @click="closeDrawer">
            <X aria-hidden="true" />
          </button>
        </div>
        <!-- Any link tap navigates; the new page starts with the drawer closed. -->
        <AdminTabs @click="closeDrawer" />
      </aside>
      <div v-if="drawerOpen" class="adm-drawer-backdrop" aria-hidden="true" @click="closeDrawer" />
      <main class="adm-main">
        <div v-if="houseLoss.alert.value" class="adm-banner adm-banner--global" role="alert">
          <p>
            <strong>{{ copy.health.lossBanner }}</strong>
            Today's NGR {{ cr(houseLoss.alert.value.netGamingRevenueToday) }} (limit −{{ cr(houseLoss.alert.value.limit) }} credits).
          </p>
          <RouterLink to="/admin/health" class="adm-btn adm-btn--secondary adm-btn--sm">Review &amp; resume</RouterLink>
          <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" aria-label="Dismiss loss-limit alert" @click="houseLoss.dismiss()">
            <X aria-hidden="true" />
          </button>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
