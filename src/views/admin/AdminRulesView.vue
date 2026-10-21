<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import RulesTab from '@/components/admin/rules/RulesTab.vue'
import SanctionsTab from '@/components/admin/rules/SanctionsTab.vue'
import AppealsTab from '@/components/admin/rules/AppealsTab.vue'
import AuditLogTab from '@/components/admin/rules/AuditLogTab.vue'
import { getAdminRules } from '@/services/adminRulesService'
import type { AdminRulesResponse, RuleSet } from '@/types/admin'
import { admin as copy } from '@/copy/admin'

const TABS = [
  { id: 'rules', label: 'Rules' },
  { id: 'sanctions', label: 'Sanctions' },
  { id: 'appeals', label: 'Appeals' },
  { id: 'audit', label: 'Audit log' },
] as const
type Tab = (typeof TABS)[number]['id']

const route = useRoute()
const router = useRouter()
const tab = computed<Tab>(() => (TABS.some((t) => t.id === route.query.tab) ? (route.query.tab as Tab) : 'rules'))
const pick = (id: Tab) => router.replace({ query: { ...route.query, tab: id === 'rules' ? undefined : id } })

const data = ref<AdminRulesResponse | null>(null)
const error = ref('')

async function load() {
  error.value = ''
  try {
    data.value = await getAdminRules()
  } catch {
    error.value = 'The rules could not be loaded. Check the API is running.'
  }
}
onMounted(load)

async function onPublished(set: RuleSet) {
  if (data.value) data.value = { ...data.value, current: set }
  await load()
}
</script>

<template>
  <AdminShell help-text="Every warning, block or restriction cites one of these rules. Editing a rule publishes a new version with your change note; players accept it before their next bet. Downloads: PDF (built here), Markdown and CSV (from the API).">
    <AdminPage :title="copy.rules.title" :eyebrow="copy.rules.eyebrow" :subtitle="copy.rules.subtitle" :page-export="false">
      <div class="adm-tabstrip" role="tablist" aria-label="Account rules sections">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="tab === t.id"
          :aria-controls="`rules-panel-${t.id}`"
          @click="pick(t.id)"
        >
          {{ t.label }}
        </button>
      </div>

      <p v-if="error" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>

      <div :id="`rules-panel-${tab}`" role="tabpanel" class="flex flex-col gap-4">
        <template v-if="tab === 'rules'">
          <RulesTab v-if="data" :current="data.current" :history="data.history" @published="onPublished" />
          <AdminLoading v-else-if="!error" text="Loading rules…" />
        </template>
        <SanctionsTab v-else-if="tab === 'sanctions'" :rules="data?.current.rules ?? []" />
        <AppealsTab v-else-if="tab === 'appeals'" />
        <AuditLogTab v-else />
      </div>
    </AdminPage>
  </AdminShell>
</template>
