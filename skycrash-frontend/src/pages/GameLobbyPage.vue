<template>
  <!-- Root wrapper -->
  <div class="dark bg-background text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
    <!-- ─── TopNavBar ────────────────────────────────────────── -->
    <header class="bg-surface/90 backdrop-blur-xl text-primary font-technical-mono text-technical-mono fixed top-0 z-50 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex justify-between items-center w-full px-margin-desktop h-16">
      <div class="flex items-center gap-8">
        <span class="font-display-multiplier text-headline-sm italic tracking-tighter text-primary glow-text-primary">AVIATOR</span>
        <div class="hidden lg:flex gap-3 items-center overflow-x-auto max-w-xl no-scrollbar">
          <span class="text-[10px] text-on-surface-variant uppercase tracking-widest mr-2">History:</span>
          <div class="flex gap-2">
            <div v-for="item in historyItems" :key="item.id" class="flex flex-col items-center">
              <span :class="item.badgeClass">{{ item.multiplier }}</span>
              <span class="text-[8px] mt-0.5 opacity-40">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-gutter">
        <div class="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-lg border border-white/10 metallic-border shadow-inner">
          <span class="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
          <span class="font-technical-mono font-bold text-white tracking-tight">{{ balance }}</span>
        </div>
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors material-symbols-outlined">help</button>
          <button class="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors material-symbols-outlined">settings</button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden pt-16">
      <!-- ─── SideNavBar / Leaderboard ─────────────────────── -->
      <aside class="bg-surface-container-lowest/80 backdrop-blur-2xl text-primary font-technical-mono text-technical-mono fixed left-0 top-16 bottom-0 flex-col pt-gutter border-r border-white/5 hidden md:flex w-[320px] z-40">
        <div class="px-6 mb-6">
          <div class="flex justify-between items-end">
            <h2 class="font-headline-sm text-headline-sm font-black text-primary tracking-tighter">LEADERBOARD</h2>
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
              <span class="text-[10px] text-on-surface-variant">1,248 Online</span>
            </div>
          </div>
        </div>

        <nav class="flex px-4 gap-1 mb-4 border-b border-white/5 pb-2">
          <button
            v-for="tab in leaderboardTabs"
            :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-white'"
            class="px-4 py-2 flex-1 font-label-caps text-[11px] tracking-widest transition-all"
          >
            {{ tab }}
          </button>
        </nav>

        <div class="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <!-- Big Win Toast -->
          <div class="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 animate-slide-in">
            <div class="bg-amber-500/20 p-1.5 rounded">
              <span class="material-symbols-outlined text-amber-400 text-sm">workspace_premium</span>
            </div>
            <div>
              <div class="text-[10px] text-amber-400 font-bold uppercase tracking-tighter">BIG WIN!</div>
              <div class="text-[12px] text-white">x***7 just won R12,400!</div>
            </div>
          </div>

          <table class="w-full text-left font-technical-mono text-[12px]">
            <thead>
              <tr class="text-on-surface-variant uppercase tracking-widest border-b border-white/5">
                <th class="py-3 font-medium">User</th>
                <th class="py-3 font-medium">Bet</th>
                <th class="py-3 font-medium">Mult</th>
                <th class="py-3 font-medium text-right">Cash</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="bet in liveBets" :key="bet.user" class="group hover:bg-white/5 transition-all">
                <td class="py-3 text-on-surface-variant group-hover:text-white transition-colors">{{ bet.user }}</td>
                <td class="py-3 text-white">{{ bet.bet }}</td>
                <td :class="bet.multiplier !== '-' ? 'text-secondary font-bold' : 'text-on-surface-variant opacity-50'" class="py-3">{{ bet.multiplier }}</td>
                <td :class="bet.cash === 'Pending' ? 'text-on-surface-variant italic' : 'text-secondary font-black glow-text-secondary'" class="py-3 text-right">{{ bet.cash }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-white/5 bg-black/20">
          <div class="flex items-center justify-between text-[10px] text-on-surface-variant uppercase tracking-tighter">
            <span>Total Bets: R1,450.00</span>
            <span class="text-secondary">Active: 4</span>
          </div>
        </div>
      </aside>

      <!-- ─── Main Canvas Area ──────────────────────────────── -->
      <main class="flex-1 flex flex-col md:ml-[320px] relative">
        <!-- Game Canvas -->
        <div class="flex-1 relative overflow-hidden grid-bg bg-surface flex flex-col items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>

          <!-- Multiplier Display -->
          <div class="z-10 text-center select-none relative">
            <span class="font-display-multiplier text-display-multiplier text-white block multiplier-curve tracking-tighter">
              {{ currentMultiplier }}<span class="text-white/60">x</span>
            </span>
            <div class="mt-2 inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
              <span class="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
              <span class="text-[12px] font-technical-mono text-white/80 uppercase tracking-widest">Live Pulse</span>
            </div>
          </div>

          <!-- Parabolic Curve & Plane SVG -->
          <div class="absolute inset-0 pointer-events-none">
            <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="curveGrad" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stop-color="#e02020" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#e02020" stop-opacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur result="blur" stdDeviation="4" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle class="pulse-node" cx="200" cy="550" fill="#e02020" r="2" />
              <circle class="pulse-node" cx="400" cy="450" fill="#e02020" r="2" />
              <circle class="pulse-node" cx="600" cy="300" fill="#e02020" r="2" />
              <path class="multiplier-curve" d="M0 600 Q 300 580 800 100" filter="url(#glow)" stroke="#e02020" stroke-linecap="round" stroke-width="8" />
              <path d="M0 600 Q 300 580 800 100 L 800 600 L 0 600 Z" fill="url(#curveGrad)" />
              <g opacity="0.6">
                <circle cx="760" cy="115" fill="#e02020" r="3" />
                <circle cx="740" cy="135" fill="#e02020" opacity="0.4" r="2" />
                <circle cx="720" cy="160" fill="#e02020" opacity="0.2" r="1.5" />
              </g>
              <g transform="translate(775, 75)">
                <circle class="animate-pulse" cx="25" cy="25" fill="#e02020" opacity="0.3" r="35" />
                <circle cx="25" cy="25" fill="#e02020" r="18" />
                <text dominant-baseline="middle" fill="white" font-family="Material Symbols Outlined" font-size="28" text-anchor="middle" x="25" y="25">flight</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- ─── Betting Controls ───────────────────────────── -->
        <div class="h-auto bg-surface-container-low border-t border-white/10 p-6 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-6xl mx-auto h-full">
            <!-- Module 1: Fresh Bet -->
            <div class="glass-panel premium-card rounded-2xl p-5 flex flex-col border border-white/5 metallic-border">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                  <span class="font-label-caps text-label-caps text-on-surface-variant tracking-tighter">BET AMOUNT</span>
                  <span class="text-[10px] text-white/40 font-technical-mono">ZAR</span>
                </div>
                <div class="flex gap-1">
                  <button class="bg-surface-container-highest px-3 py-1 rounded text-[10px] font-black font-technical-mono border border-white/5 hover:bg-white/10 transition-colors uppercase">Manual</button>
                  <button class="bg-primary/10 text-primary px-3 py-1 rounded text-[10px] font-black font-technical-mono border border-primary/20 transition-colors uppercase">Auto</button>
                </div>
              </div>
            </div>

            <!-- Module 2: Active Bet -->
            <div class="glass-panel premium-card rounded-2xl p-5 flex flex-col border border-secondary/30 metallic-border shadow-[0_0_40px_rgba(19,255,67,0.1)]">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                  <span class="font-label-caps text-label-caps text-secondary font-black tracking-tighter">LIVE BET ACTIVE</span>
                </div>
                <span class="font-technical-mono text-[12px] text-secondary font-bold glow-text-secondary">PROFIT: +R15.00</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const balance = ref('R1,254.80')
const currentMultiplier = ref('2.50')
const leaderboardTabs = ['Live Bets', 'My Bets', 'Top']
const activeTab = ref('Live Bets')

const historyItems = ref([
  { id: 1, multiplier: '1.20x', time: '12:01', badgeClass: 'bg-surface-container-high border border-white/5 px-3 py-1 rounded text-on-surface-variant font-bold' },
  { id: 2, multiplier: '4.50x', time: '12:03', badgeClass: 'bg-purple-900/40 border border-purple-500/30 px-3 py-1 rounded text-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
  { id: 3, multiplier: '1.05x', time: '12:04', badgeClass: 'bg-surface-container-high border border-white/5 px-3 py-1 rounded text-on-surface-variant font-bold' },
  { id: 4, multiplier: '12.8x', time: '12:05', badgeClass: 'bg-amber-900/40 border border-amber-500/30 px-3 py-1 rounded text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
  { id: 5, multiplier: '1.88x', time: '12:07', badgeClass: 'bg-blue-900/40 border border-blue-500/30 px-3 py-1 rounded text-blue-400 font-bold' },
])

const liveBets = ref([
  { user: 'j***9', bet: '100.00', multiplier: '2.50x', cash: '250.00' },
  { user: 'k***2', bet: '25.00',  multiplier: '-',     cash: 'Pending' },
  { user: 's***x', bet: '500.00', multiplier: '1.80x', cash: '900.00' },
  { user: 'b***0', bet: '10.00',  multiplier: '-',     cash: 'Pending' },
])
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.metallic-border {
  border: 1px solid transparent;
  background:
    linear-gradient(#1d2023, #1d2023) padding-box,
    linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 100%) border-box;
}

.glow-text-secondary {
  text-shadow: 0 0 15px rgba(19, 255, 67, 0.5);
}

.grid-bg {
  background-size: 60px 60px;
  background-image:
    radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
}

.multiplier-curve {
  filter: drop-shadow(0 0 25px rgba(224, 32, 32, 0.8));
}

.pulse-node {
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}
</style>
