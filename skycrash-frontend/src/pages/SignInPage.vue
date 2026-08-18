<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
    <!-- Atmospheric Background -->
    <div class="absolute inset-0 z-0">
      <img
        class="w-full h-full object-cover opacity-40 mix-blend-screen"
        :src="bgImageUrl"
        alt=""
      />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background/80 to-background/95"></div>
    </div>

    <!-- Main Content Container -->
    <main class="relative z-10 w-full max-w-md px-margin-mobile">
      <!-- Brand Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface/50 backdrop-blur-md border border-primary/20 shadow-[0_0_24px_rgba(255,180,169,0.5)] mb-4">
          <span
            class="material-symbols-outlined text-primary text-4xl"
            style="font-variation-settings: 'FILL' 1;"
          >flight_takeoff</span>
        </div>
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile italic font-black text-primary tracking-tighter uppercase drop-shadow-[0_0_12px_rgba(255,180,169,0.5)] md:font-headline-lg md:text-headline-lg">
          {{ brandName }}
        </h1>
        <p class="font-body-md text-body-md text-on-surface mt-2 opacity-90">{{ tagline }}</p>
      </div>

      <!-- Login Card -->
      <div class="glass-panel rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(255,180,169,0.8)]"></div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Email Input -->
          <div class="space-y-2">
            <label class="font-label-mono text-label-mono text-on-surface-variant block uppercase" for="email">
              Pilot ID (Email)
            </label>
            <div class="relative input-glow transition-all duration-300 border-b border-white/20 rounded-t-DEFAULT bg-black/30">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">person</span>
              </div>
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                required
                placeholder="callsign@domain.com"
                class="block w-full pl-10 pr-3 py-3 bg-transparent border-none text-white font-body-md focus:ring-0 placeholder-on-surface-variant/50"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="font-label-mono text-label-mono text-on-surface-variant block uppercase" for="password">
                Clearance Code
              </label>
              <a
                class="font-label-mono text-[12px] text-primary hover:text-primary-fixed hover:drop-shadow-[0_0_8px_rgba(255,180,169,0.6)] transition-all"
                href="#"
                @click.prevent="$emit('forgot-password')"
              >
                Forgot Code?
              </a>
            </div>
            <div class="relative input-glow transition-all duration-300 border-b border-white/20 rounded-t-DEFAULT bg-black/30">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
              </div>
              <input
                id="password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="block w-full pl-10 pr-10 py-3 bg-transparent border-none text-white font-body-md focus:ring-0 placeholder-on-surface-variant/50"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-white transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-sm">
                  {{ showPassword ? "visibility" : "visibility_off" }}
                </span>
              </button>
            </div>
          </div>

          <!-- Action Button -->
          <button
            type="submit"
            class="w-full py-4 rounded-lg bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wider hover:bg-primary-fixed active:scale-[0.98] transition-all duration-300 shadow-[0_0_24px_rgba(255,180,169,0.6)] hover:shadow-[0_0_36px_rgba(255,180,169,0.8)] flex items-center justify-center gap-2 mt-4"
          >
            <span>Engage</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 pt-6 border-t border-white/10 text-center">
          <p class="font-body-md text-sm text-white/60 mb-3">
            New Pilot?
            <button
              @click="goToRegister"
              class="text-primary hover:text-primary-fixed hover:drop-shadow-[0_0_8px_rgba(255,180,169,0.6)] transition-all font-bold"
            >
              Join Squadron
            </button>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const props = defineProps({
  brandName: {
    type: String,
    default: "SKYCRASH",
  },
  tagline: {
    type: String,
    default: "Authorized Personnel Only",
  },
  bgImageUrl: {
    type: String,
    default:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ui7Cew4P4cL6P_urE2uJIGxksdYiuYtek1gGZFfexlJHQ5kut6hRB1WhJ050HC5_Y6XmuM4g4rh9cbHfXPve3SrCk9rwLgjaj219zFUuxpEDZWV5hRoDhWrt-NHbmShq4F2qjwoYawfGlho3_ZRM_VtqARorwpEtRxAp9VJCiWbFfIr1JPAEjlWVE078Tx1r1TQm17EnBvK-TQeAJnvccStSwZ7wOYzx3JbjcORiWg_IA4lPX80y",
  },
})

const handleSubmit = () => {
  if (email.value && password.value) {
    router.push('/game-lobby')
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}
</style>
