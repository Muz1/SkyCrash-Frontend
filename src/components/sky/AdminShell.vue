<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Moon, Sun } from '@lucide/vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import logo from '@/assets/logo-skycrash.png'
import AdminTabs from './AdminTabs.vue'
import HelpTip from './HelpTip.vue'
import '@/components/admin/admin.css'

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
        <img :src="logo" alt="Sky Crash" width="1152" height="576" />
        <span class="adm-brand-divider" aria-hidden="true" />
        <span class="adm-brand-label">Admin Dashboard</span>
      </div>
      <div class="flex items-center gap-3">
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
        <button type="button" class="adm-btn adm-btn--ghost" @click="handleLogout">
          <LogOut aria-hidden="true" /> <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>

    <div class="adm-layout">
      <aside class="adm-sidebar">
        <AdminTabs />
      </aside>
      <main class="adm-main">
        <slot />
      </main>
    </div>
  </div>
</template>
