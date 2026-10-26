<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { Copy, Printer, RefreshCw, Ban, UserPlus, Power, MonitorPlay } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import PanelLeaderboard from '@/components/admin/PanelLeaderboard.vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import * as service from '@/services/accessLinkService'
import type { AccessLink, PanelOverview } from '@/services/accessLinkService'
import { apiMessage } from '@/lib/apiError'
import { count, cr, dateTime } from '@/lib/reportFormat'

/**
 * Panel access links: the six panel pilots (Maverick, Goose …), each with a link and QR code
 * that signs straight into that player account. Links work until switched off here.
 */
const links = ref<AccessLink[]>([])
const qr = ref<Record<string, string>>({})
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const copied = ref<string | null>(null)
const panel = ref<PanelOverview | null>(null)
const panelMissing = ref(false)
// 404 = the API hasn't been redeployed with the panel lobby yet.
const loadPanel = () =>
  service
    .getPanelOverview()
    .then((p) => {
      panel.value = p
      panelMissing.value = false
    })
    .catch(() => (panelMissing.value = true))

async function draw() {
  const next: Record<string, string> = {}
  for (const l of links.value.filter((x) => x.active)) {
    next[l.id] = await QRCode.toDataURL(l.url, { margin: 1, width: 220, errorCorrectionLevel: 'M' })
  }
  qr.value = next
}
watch(links, () => void draw())

/** One card per pilot: its active link, or its most recent one if it's been switched off. */
const rows = computed(() => {
  const byPlayer = new Map<string, AccessLink>()
  for (const l of links.value) {
    const seen = byPlayer.get(l.playerId)
    if (!seen || (l.active && !seen.active) || (l.active === seen.active && l.createdAtUtc > seen.createdAtUtc)) byPlayer.set(l.playerId, l)
  }
  return [...byPlayer.values()].sort((a, b) => a.username.localeCompare(b.username))
})

async function run(action: () => Promise<void>) {
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = apiMessage(e) ?? 'Something went wrong. Try again.'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  void loadPanel()
  return run(async () => {
    links.value = await service.listAccessLinks()
  }).finally(() => (loading.value = false))
})

const createPilots = () => run(async () => {
  links.value = await service.createPanelPilots()
  await loadPanel()
})

const regenerate = (l: AccessLink) => {
  if (l.active && !confirm(`Make a new link for ${l.username}? The current link and QR code stop working.`)) return
  return run(async () => {
    await service.regenerateAccessLink(l.id)
    links.value = await service.listAccessLinks()
  })
}

const revoke = (l: AccessLink) => {
  if (!confirm(`Switch off ${l.username}'s link? Anyone using it will need a new one.`)) return
  return run(async () => {
    await service.revokeAccessLink(l.id)
    links.value = await service.listAccessLinks()
  })
}

async function copy(l: AccessLink) {
  try {
    await navigator.clipboard.writeText(l.url)
    copied.value = l.id
    setTimeout(() => (copied.value = null), 2000)
  } catch {
    error.value = 'Could not copy. Select the link and copy it by hand.'
  }
}

/** Opens a plain page with every active QR code, ready to print and hand to the panel. */
function printSheet() {
  const active = links.value.filter((l) => l.active && qr.value[l.id])
  const w = window.open('', '_blank')
  if (!w) return
  const cards = active
    .map((l) => `<div class="card"><img src="${qr.value[l.id]}" alt=""><h2>${l.username}</h2><p>Scan to fly as ${l.username}</p></div>`)
    .join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SkyCrash panel pilots</title><style>
    body{font-family:system-ui,sans-serif;margin:24px;color:#111}
    h1{font-size:20px;margin:0 0 16px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .card{border:1px solid #ccc;border-radius:12px;padding:16px;text-align:center;break-inside:avoid}
    .card img{width:180px;height:180px}
    .card h2{margin:8px 0 2px;font-size:20px}
    .card p{margin:0;font-size:13px;color:#555}
  </style></head><body><h1>SkyCrash · panel pilots</h1><div class="grid">${cards}</div></body></html>`)
  w.document.close()
  w.onload = () => w.print()
}
</script>

<template>
  <AdminShell help-text="Each panel pilot has a private link and QR code that signs straight into that player account, no password needed. Hand them out during the demo. Regenerate makes a new link (the old QR stops working); Switch off disables it.">
    <AdminPage :page-export="false" title="Panel access links" eyebrow="Game management" subtitle="Six ready-to-play pilots for the panel: scan a QR code and fly.">
      <template #actions>
        <AdminButton :disabled="busy" @click="createPilots"><UserPlus aria-hidden="true" /> Create the 6 panel pilots</AdminButton>
        <AdminButton :disabled="busy || !links.some((l) => l.active)" @click="printSheet"><Printer aria-hidden="true" /> Print QR sheet</AdminButton>
        <RouterLink to="/watch/panel" class="inline-flex">
          <AdminButton variant="primary"><MonitorPlay aria-hidden="true" /> View game</AdminButton>
        </RouterLink>
      </template>

      <p v-if="panelMissing" class="adm-error" role="alert">
        The panel lobby and leaderboard aren't available on the server yet: the API needs redeploying (Render → skycrash-api → Manual Deploy → Deploy latest commit).
      </p>
      <AdminPanel
        v-if="panel"
        :title="`${panel.lobbyName} · lobby ${panel.inviteCode}`"
        :caption="`Every pilot joins this lobby when they open their link or QR code. ${panel.members.length} in it, ${panel.members.filter((m) => m.online).length} online.`"
        accent="magenta"
      >
        <RouterLink to="/watch/panel" class="inline-flex">
          <AdminButton variant="primary"><MonitorPlay aria-hidden="true" /> View their game live</AdminButton>
        </RouterLink>
      </AdminPanel>

      <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
      <AdminLoading v-if="loading" text="Loading links…" />
      <AdminPanel v-else-if="!links.length" title="No pilots yet" caption="Create them once; each gets 500 bonus credits, a verified email and the rules already accepted." accent="blue">
        <AdminButton variant="primary" :disabled="busy" @click="createPilots"><UserPlus aria-hidden="true" /> Create the 6 panel pilots</AdminButton>
      </AdminPanel>

      <div v-else class="adm-tiles" role="list" aria-label="Panel pilots">
        <div v-for="l in rows" :key="l.id" role="listitem" :class="['adm-tile', l.active ? 'adm-tile--ok' : 'adm-tile--bad']">
          <span class="adm-tile-label">{{ l.active ? 'Link active' : 'Switched off' }}</span>
          <span class="adm-tile-value">{{ l.username }}</span>
          <span class="adm-tile-detail adm-num">
            Balance {{ cr(l.creditBalance) }} · used {{ count(l.useCount) }}×<template v-if="l.lastUsedAtUtc"> · last {{ dateTime(l.lastUsedAtUtc) }}</template>
          </span>
          <template v-if="l.active">
            <img v-if="qr[l.id]" :src="qr[l.id]" :alt="`QR code for ${l.username}`" class="mt-2 h-40 w-40 self-center rounded-md bg-white p-1" />
            <span class="adm-tile-detail break-all">{{ l.url }}</span>
            <div class="mt-2 flex flex-wrap gap-2">
              <AdminButton size="sm" @click="copy(l)"><Copy aria-hidden="true" /> {{ copied === l.id ? 'Copied' : 'Copy link' }}</AdminButton>
              <AdminButton size="sm" variant="ghost" :disabled="busy" @click="regenerate(l)"><RefreshCw aria-hidden="true" /> Regenerate</AdminButton>
              <AdminButton size="sm" variant="danger" :disabled="busy" @click="revoke(l)"><Ban aria-hidden="true" /> Switch off</AdminButton>
            </div>
          </template>
          <div v-else class="mt-2">
            <AdminButton size="sm" variant="primary" :disabled="busy" @click="regenerate(l)"><Power aria-hidden="true" /> Turn on again (new link)</AdminButton>
          </div>
        </div>
      </div>
      <p v-if="rows.length" class="adm-note mt-3">
        Open a link on the panel member's phone, not in this browser: opening it here would sign you out of the admin console.
      </p>

      <PanelLeaderboard v-if="panel" class="mt-4" :rows="panel.leaderboard" />
    </AdminPage>
  </AdminShell>
</template>
