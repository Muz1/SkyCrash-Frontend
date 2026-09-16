<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import CRTOverlay from "@/components/sky/CRTOverlay.vue";
import CreditDisplay from "@/components/sky/CreditDisplay.vue";
import SkyEnvironment from "@/components/sky/SkyEnvironment.vue";
import Ambient from "@/components/sky/Ambient.vue";
import Aircraft from "@/components/sky/Aircraft.vue";
import NavDock from "@/components/sky/NavDock.vue";
import Wordmark from "@/components/sky/Wordmark.vue";
import { CRAFTS, RARITY_STYLE, getCraft, type CraftId, type Rarity } from "@/lib/craft";
import { SKY_SKINS, type SkinId } from "@/lib/skyEnvironments";
import { useAuthStore } from "@/stores/auth";
import { useHangarStore } from "@/stores/hangar";
import { cn } from "@/lib/utils";

const auth = useAuthStore();
const hangar = useHangarStore();
const credits = computed(() => auth.player?.creditBalance ?? 0);

function rarityBadgeClass(rarity: Rarity) {
  const s = RARITY_STYLE[rarity];
  return cn(
    "clip-hud inline-block border px-2 py-1 font-arcade text-[7px] uppercase leading-none",
    s.border,
    s.text,
    rarity === "LEGENDARY" || rarity === "SPECIAL" ? s.glow : "",
  );
}

type Tab = "aircraft" | "skies";
const tab = ref<Tab>("aircraft");

const previewCraft = ref<CraftId>(hangar.craftId);
const previewSky = ref<SkinId>(hangar.skinId === "taking-off" ? "sunset-runway" : hangar.skinId);
const outgoing = ref<CraftId | null>(null);
const enterKey = ref(0);

watch(
  () => hangar.craftId,
  (next) => {
    previewCraft.value = next;
  },
);
watch(
  () => hangar.skinId,
  (next) => {
    if (next !== "taking-off") previewSky.value = next;
  },
);

const active = computed(() => getCraft(previewCraft.value));
const activeSky = computed(() => SKY_SKINS.find((s) => s.id === previewSky.value) ?? SKY_SKINS[0]!);

function tryOn(id: CraftId) {
  if (id === previewCraft.value) return;
  outgoing.value = previewCraft.value;
  previewCraft.value = id;
  enterKey.value += 1;
  setTimeout(() => (outgoing.value = null), 620);
}

const craftEquipped = computed(() => hangar.craftId === previewCraft.value);
const skyEquipped = computed(() => hangar.skinId === previewSky.value);

function equipCraft() {
  hangar.equip(previewCraft.value, hangar.skinId);
}

function equipSky() {
  hangar.equip(hangar.craftId, previewSky.value);
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <SkyEnvironment :skin="previewSky" :dim="0.5" />
    <Ambient :skin="previewSky" />
    <CRTOverlay />

    <header class="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
      <div class="min-w-0">
        <Wordmark compact />
      </div>
      <CreditDisplay :credits="credits" />
    </header>

    <main class="relative z-10 mx-auto w-full max-w-6xl px-4 pb-44 sm:px-6">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.3em] text-magenta text-glow-magenta sm:text-4xl">
        Hangar
      </h1>
      <p class="mt-1 font-arcade text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
        Loadout · Aircraft &amp; Skies
      </p>

      <div class="mt-5 flex gap-2">
        <button
          v-for="t in (['aircraft', 'skies'] as Tab[])"
          :key="t"
          class="clip-hud border-2 px-5 py-2 font-arcade text-[9px] uppercase tracking-[0.2em] transition-all duration-150"
          :class="
            tab === t
              ? 'border-ember bg-[image:var(--grad-sunset)] text-void [box-shadow:var(--glow-ember)]'
              : 'border-violet/50 text-muted-foreground hover:border-electric hover:text-electric'
          "
          @click="tab = t"
        >
          {{ t === "aircraft" ? "Aircraft" : "Skies" }}
        </button>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-label="Preview" class="neon-panel clip-hud relative min-h-[300px] overflow-hidden p-4 sm:min-h-[380px]">
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0"
            style="background: radial-gradient(ellipse at 30% 80%, color-mix(in oklab, var(--neon-violet) 30%, transparent), transparent 65%)"
          />
          <div class="relative grid h-full min-h-[260px] place-items-center sm:min-h-[330px]">
            <div style="animation: camera-idle 6s ease-in-out infinite">
              <div
                v-if="outgoing"
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style="animation: craft-exit-preview 560ms cubic-bezier(0.4, 0, 0.7, 1) forwards"
              >
                <Aircraft :craft="outgoing" :size="260" :idle="false" :trail="false" />
              </div>
              <div
                :key="enterKey"
                :style="
                  enterKey > 0
                    ? { animation: 'craft-enter-preview 700ms cubic-bezier(0.2,0.8,0.3,1) 180ms both' }
                    : undefined
                "
              >
                <Aircraft :craft="previewCraft" :size="280" :trail-intensity="0.7" />
              </div>
            </div>
          </div>

          <p class="relative mt-2 text-center font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
            {{ activeSky.name }} · Preview Bay
          </p>
        </section>

        <section aria-label="Details" class="neon-panel clip-hud p-5">
          <div v-if="tab === 'aircraft'" class="animate-sky-pop">
            <p class="font-display text-2xl font-black uppercase tracking-[0.2em] text-foreground">{{ active.name }}</p>
            <div class="mt-2">
              <span :class="rarityBadgeClass(active.rarity)">{{ active.rarity }}</span>
            </div>
            <p class="mt-4 text-sm leading-relaxed text-muted-foreground">{{ active.blurb }}</p>

            <p class="mt-5 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Status</p>
            <p class="font-arcade text-sm" :class="craftEquipped ? 'text-lime text-glow-lime' : 'text-ember text-glow-ember'">
              {{ craftEquipped ? "Equipped" : "Trying On" }}
            </p>

            <div class="mt-6 flex flex-col gap-3">
              <ArcadeButton size="lg" variant="primary" :disabled="craftEquipped" @click="equipCraft">
                {{ craftEquipped ? "Equipped" : "Equip Aircraft" }}
              </ArcadeButton>
              <RouterLink to="/play">
                <ArcadeButton size="sm" variant="blue" class="w-full">To The Runway</ArcadeButton>
              </RouterLink>
            </div>
          </div>

          <div v-else class="animate-sky-pop">
            <p class="font-display text-2xl font-black uppercase tracking-[0.2em] text-foreground">{{ activeSky.name }}</p>
            <p class="mt-4 text-sm leading-relaxed text-muted-foreground">{{ activeSky.blurb }}</p>

            <p class="mt-5 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Status</p>
            <p class="font-arcade text-sm" :class="skyEquipped ? 'text-lime text-glow-lime' : 'text-electric text-glow-blue'">
              {{ skyEquipped ? "Equipped" : "Previewing" }}
            </p>

            <div class="mt-6 flex flex-col gap-3">
              <ArcadeButton size="lg" variant="primary" :disabled="skyEquipped" @click="equipSky">
                {{ skyEquipped ? "Equipped" : "Equip Sky" }}
              </ArcadeButton>
              <RouterLink to="/play">
                <ArcadeButton size="sm" variant="blue" class="w-full">To The Runway</ArcadeButton>
              </RouterLink>
            </div>
          </div>
        </section>
      </div>

      <div class="mt-6">
        <ul v-if="tab === 'aircraft'" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="c in CRAFTS" :key="c.id">
            <button
              class="clip-hud flex w-full items-center gap-3 border-2 bg-void/60 p-3 text-left transition-all duration-150 hover:-translate-y-0.5"
              :class="
                previewCraft === c.id
                  ? cn(RARITY_STYLE[c.rarity].border, RARITY_STYLE[c.rarity].glow)
                  : 'border-violet/40 hover:border-electric'
              "
              @click="tryOn(c.id)"
            >
              <img
                :src="c.src"
                alt=""
                width="1024"
                height="1024"
                loading="lazy"
                class="h-14 w-14 shrink-0 object-contain"
                :style="{ transform: `rotate(${c.rotate}deg)` }"
              />
              <span class="min-w-0 flex-1">
                <span class="block font-arcade text-[8px] uppercase text-foreground">{{ c.name }}</span>
                <span class="mt-1 block font-arcade text-[6px] uppercase" :class="RARITY_STYLE[c.rarity].text">
                  {{ c.rarity }}
                </span>
                <span class="mt-1 block text-[11px] leading-snug text-muted-foreground">
                  {{ hangar.craftId === c.id ? "Equipped" : previewCraft === c.id ? "On the pad" : "Try on" }}
                </span>
              </span>
            </button>
          </li>
        </ul>
        <ul v-else class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <li v-for="s in SKY_SKINS.filter((skin) => skin.id !== 'taking-off')" :key="s.id">
            <button
              class="clip-hud w-full overflow-hidden border-2 text-left transition-all duration-150 hover:-translate-y-0.5"
              :class="previewSky === s.id ? 'border-lime [box-shadow:var(--glow-lime)]' : 'border-violet/40 hover:border-magenta'"
              @click="previewSky = s.id"
            >
              <img :src="s.src" alt="" width="1920" height="1088" loading="lazy" class="h-20 w-full object-cover" />
              <span class="block px-2 py-2 font-arcade text-[7px] uppercase text-foreground">
                {{ s.name }}
                <span v-if="hangar.skinId === s.id" class="ml-1 text-lime">·EQ</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </main>

    <NavDock />
  </div>
</template>
