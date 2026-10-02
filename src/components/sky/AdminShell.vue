<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from '@lucide/vue'
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

function handleLogout() {
  authStore.logout()
  playerStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="admin-console flex h-dvh flex-col overflow-hidden">
    <header class="adm-topbar">
      <div class="adm-brand">
        <img :src="logo" alt="Sky Crash" width="1152" height="576" />
        <span class="adm-brand-divider" aria-hidden="true" />
        <span class="adm-brand-label">Admin Console</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="adm-user">
          <span class="adm-avatar" aria-hidden="true">{{ initial }}</span>
          <div class="hidden sm:block">
            <p class="adm-user-name">{{ adminName }}</p>
            <p class="adm-user-role">Administrator</p>
          </div>
        </div>
        <button type="button" class="adm-btn adm-btn--ghost" @click="handleLogout">
          <LogOut aria-hidden="true" /> Logout
        </button>
      </div>
    </header>

    <nav class="adm-tabbar" aria-label="Admin sections">
      <AdminTabs />
      <div class="flex shrink-0 items-center">
        <HelpTip v-if="helpText" :text="helpText" />
      </div>
    </nav>

    <main class="adm-main">
      <slot />
    </main>
  </div>
</template>
