<script setup lang="ts">
import AdminPanel from './AdminPanel.vue'
import AdminLoading from './AdminLoading.vue'
import type { PanelLeaderboardRow } from '@/services/accessLinkService'
import { count, cr, dateTime, mult } from '@/lib/reportFormat'

/** The six panel pilots ranked by net result (paid out − wagered), best first. */
defineProps<{ rows: PanelLeaderboardRow[] | null }>()

const signed = (v: number) => (v > 0 ? `+${cr(v)}` : cr(v))
</script>

<template>
  <AdminPanel title="Panel leaderboard" caption="Ranked by net result: winnings paid out minus credits wagered. Settled bets only." accent="ember" flush>
    <div v-if="rows" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th class="adm-num">#</th>
            <th>Pilot</th>
            <th class="adm-num">Net</th>
            <th class="adm-num">Balance</th>
            <th class="adm-num">Rounds</th>
            <th class="adm-num">Won / lost</th>
            <th class="adm-num">Wagered</th>
            <th class="adm-num">Best cash-out</th>
            <th class="adm-num">Biggest win</th>
            <th>Last bet</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.playerId">
            <td class="adm-num adm-strong">{{ i + 1 }}</td>
            <td class="adm-strong">
              <span
                class="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                :style="{ background: r.online ? 'var(--neon-lime)' : 'var(--adm-border)' }"
                :aria-label="r.online ? 'Online' : 'Offline'"
                role="img"
              />{{ r.username }}
            </td>
            <td class="adm-num adm-strong" :style="{ color: r.net > 0 ? 'var(--neon-lime)' : r.net < 0 ? 'var(--neon-magenta)' : undefined }">{{ signed(r.net) }}</td>
            <td class="adm-num">{{ cr(r.creditBalance) }}</td>
            <td class="adm-num">{{ count(r.rounds) }}</td>
            <td class="adm-num">{{ count(r.wins) }} / {{ count(r.losses) }}</td>
            <td class="adm-num">{{ cr(r.wagered) }}</td>
            <td class="adm-num">{{ r.bestCashOutMultiplier == null ? '—' : mult(r.bestCashOutMultiplier) }}</td>
            <td class="adm-num">{{ r.biggestWin > 0 ? cr(r.biggestWin) : '—' }}</td>
            <td class="adm-muted adm-num-inline">{{ r.lastBetAtUtc ? dateTime(r.lastBetAtUtc) : 'Not yet' }}</td>
          </tr>
          <tr v-if="rows.length === 0"><td colspan="10" class="adm-empty">No panel pilots yet. Create them on Panel Access Links.</td></tr>
        </tbody>
      </table>
    </div>
    <AdminLoading v-else />
  </AdminPanel>
</template>
