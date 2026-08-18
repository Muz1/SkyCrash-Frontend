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
        <button 
          class="w-full relative group" 
          @click="goToGame"
        >
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
          @click="goToSignIn"
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

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
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
})

const bgImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ui7Cew4P4cL6P_urE2uJIGxksdYiuYtek1gGZFfexlJHQ5kut6hRB1WhJ050HC5_Y6XmuM4g4rh9cbHfXPve3SrCk9rwLgjaj219zFUuxpEDZWV5hRoDhWrt-NHbmShq4F2qjwoYawfGlho3_ZRM_VtqARorwpEtRxAp9VJCiWbFfIr1JPAEjlWVE078Tx1r1TQm17EnBvK-TQeAJnvccStSwZ7wOYzx3JbjcORiWg_IA4lPX80y"

const goToGame = () => {
  router.push('/game-lobby')
}

const goToSignIn = () => {
  router.push('/sign-in')
}
</script>

<style>
.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
</style>
