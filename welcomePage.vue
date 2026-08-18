<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-hidden relative">
    <!-- Immersive Background -->
    <div class="absolute inset-0 z-0">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
        :style="{ backgroundImage: `url('${bgImageUrl}')` }"
      ></div>
      <div class="absolute inset-0 hero-bg"></div>
      <div
        class="absolute inset-0 grid-lines opacity-60"
        style="transform: rotateX(60deg) scale(2); transform-origin: bottom;"
      ></div>
      <div class="absolute right-0 top-0 w-[800px] h-[800px] overflow-hidden opacity-40 mix-blend-screen">
        <div class="radar-sweep"></div>
      </div>
    </div>

    <!-- Main Content Container -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-xl w-full max-w-4xl mx-auto h-screen">
      <!-- Logo / Title Area -->
      <div class="flex flex-col items-center text-center mb-16 relative">
        <div class="w-32 h-32 mb-6 relative">
          <div class="absolute inset-0 bg-primary-container/40 rounded-full blur-2xl animate-pulse"></div>
          <div class="relative w-full h-full glass-panel rounded-full flex items-center justify-center border-primary/40 shadow-[0_0_40px_rgba(255,85,69,0.3)]">
            <span
              class="material-symbols-outlined text-display-multiplier text-primary drop-shadow-[0_0_15px_rgba(255,180,169,0.8)]"
              style="font-variation-settings: 'FILL' 1;"
            >
              flight_takeoff
            </span>
          </div>
        </div>
        <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg italic font-black text-white tracking-tighter mb-2 drop-shadow-lg">
          {{ title }}
        </h1>
        <p class="font-label-mono text-label-mono text-primary uppercase tracking-[0.2em] drop-shadow-md">
          {{ subtitle }}
        </p>
      </div>

      <!-- Action Area -->
      <div class="flex flex-col w-full max-w-sm gap-y-6">
        <!-- Primary CTA -->
        <button class="w-full relative group" @click="$emit('start')">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary to-primary-container rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
          <div class="relative flex items-center justify-center gap-3 w-full bg-primary-container text-white font-headline-md text-headline-md py-4 px-8 rounded-lg glow-button-primary uppercase tracking-wide font-bold overflow-hidden">
            <span class="material-symbols-outlined">power_settings_new</span>
            <span>{{ primaryCtaLabel }}</span>
            <div class="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shine_1s_ease-in-out]"></div>
          </div>
        </button>

        <!-- Secondary CTA -->
        <button
          class="w-full glass-panel hover:bg-white/5 border-outline-variant hover:border-primary/50 text-white font-headline-md text-headline-md py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide hover:shadow-[0_0_20px_rgba(255,180,169,0.2)]"
          @click="$emit('sign-in')"
        >
          <span class="material-symbols-outlined text-primary">login</span>
          <span>{{ secondaryCtaLabel }}</span>
        </button>
      </div>

      <!-- System Status Footer -->
      <div class="absolute bottom-margin-mobile md:bottom-lg left-0 w-full flex justify-center">
        <div class="glass-panel px-5 py-2.5 rounded-full flex items-center gap-3 border-primary/20">
          <div class="w-2.5 h-2.5 rounded-full bg-vibrant-red animate-pulse shadow-[0_0_12px_rgba(255,26,26,0.9)]"></div>
          <span class="font-label-mono text-label-mono text-white/90 text-[11px] tracking-wider font-semibold shadow-sm">
            {{ statusText }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "SkyCrashWelcome",
  props: {
    title: {
      type: String,
      default: "SKYCRASH",
    },
    subtitle: {
      type: String,
      default: "Aviator Command Protocol",
    },
    primaryCtaLabel: {
      type: String,
      default: "Start Engines",
    },
    secondaryCtaLabel: {
      type: String,
      default: "Sign In",
    },
    statusText: {
      type: String,
      default: "SYSTEM ONLINE • READY FOR DEPARTURE",
    },
    bgImageUrl: {
      type: String,
      default:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBw50038w76iPzIKgQ5Ca1ZNRt9bufCtT4xgBn22TqPkXBves5sFjGTFyj_cVDeruSro8V0PO2UIpO2hCGXZ_qupkYbZX4TpxdwSU9N4E8uBQyz97Df1xxwUGtMktEZ04fOkXyhIwI5B9jTYhOVxziL5Qbl3liq8J_-LQUGCMUTghaku-QaQOpVmpMPEg8B7x9t5UqgmFDTFkDSILpg6AM-AXCk06WUfhl-4N_X0IQ4aGF0fOLLveyV",
    },
  },
  emits: ["start", "sign-in"],
};
</script>

<style scoped>
.glass-panel {
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 180, 169, 0.15);
  box-shadow: inset 0 0 20px rgba(255, 180, 169, 0.05);
}

.glow-button-primary {
  box-shadow: 0 0 25px rgba(255, 85, 69, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 180, 169, 0.3);
}

.glow-button-primary:hover {
  box-shadow: 0 0 35px rgba(255, 85, 69, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.hero-bg {
  background: radial-gradient(circle at center, rgba(255, 85, 69, 0.2) 0%, transparent 60%),
    linear-gradient(to bottom, rgba(33, 14, 12, 0.8) 0%, rgba(33, 14, 12, 1) 100%);
}

.radar-sweep {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: conic-gradient(from 0deg, transparent 70%, rgba(255, 85, 69, 0.1) 90%, rgba(255, 85, 69, 0.5) 100%);
  border-radius: 50%;
  animation: sweep 4s linear infinite;
  pointer-events: none;
  opacity: 0.4;
}

@keyframes sweep {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.grid-lines {
  background-image: linear-gradient(to right, rgba(255, 85, 69, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 85, 69, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  perspective: 1000px;
}

@keyframes shine {
  100% {
    left: 125%;
  }
}
</style>

<style>
/* Unscoped: needs to apply to the real <body> element, which a scoped
   style block cannot reach. Import this component's CSS once globally
   (e.g. in your root App.vue or main entry) rather than per-instance. */
body {
  min-height: max(884px, 100dvh);
}
</style>