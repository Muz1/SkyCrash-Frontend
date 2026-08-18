<template>
  <div class="bg-[#120807] text-on-background min-h-screen flex items-center justify-center relative overflow-hidden font-body-md">
    <!-- Atmospheric Background -->
    <div class="fixed inset-0 z-0 bg-[#0d0504]">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
        :style="{ backgroundImage: `url('${bgImageUrl}')` }"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a0302] via-[#0a0302]/70 to-transparent"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,180,169,0.08)_0%,transparent_70%)]"></div>
      <!-- Abstract HUD Elements -->
      <div
        class="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full border border-primary/5 filter blur-2xl animate-pulse"
        style="animation-duration: 4s;"
      ></div>
      <div class="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full filter blur-[100px]"></div>
    </div>

    <!-- Main Registration Panel -->
    <div class="relative z-10 w-full max-w-md px-margin-mobile">
      <div class="bg-surface-container-low/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-lg md:p-xl shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col gap-lg">
        <!-- Header -->
        <div class="text-center space-y-sm relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10 pointer-events-none"></div>
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="material-symbols-outlined fill text-primary text-4xl drop-shadow-[0_0_15px_rgba(255,180,169,0.6)]">
              flight_takeoff
            </span>
          </div>
          <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-white italic font-black tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {{ brandName }}
          </h1>
          <p class="font-label-mono text-label-mono text-primary/80 uppercase tracking-[0.2em] text-xs">
            {{ tagline }}
          </p>
        </div>

        <!-- Registration Form -->
        <form class="flex flex-col gap-md mt-sm" @submit.prevent="handleSubmit">
          <!-- Pilot Name Input -->
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-white/40 group-focus-within:text-primary transition-colors text-xl">person</span>
            </div>
            <input
              id="pilot_name"
              v-model="form.pilotName"
              type="text"
              required
              placeholder="Pilot Call Sign"
              class="w-full bg-white/5 border border-white/10 text-white font-body-md text-body-md rounded-xl py-3.5 pl-12 pr-4 focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-white/30"
            />
            <div class="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary/0 group-focus-within:via-primary/50 to-transparent w-full transition-all duration-500"></div>
          </div>

          <!-- Email Input -->
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-white/40 group-focus-within:text-primary transition-colors text-xl">mail</span>
            </div>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="Comms Address (Email)"
              class="w-full bg-white/5 border border-white/10 text-white font-body-md text-body-md rounded-xl py-3.5 pl-12 pr-4 focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-white/30"
            />
            <div class="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary/0 group-focus-within:via-primary/50 to-transparent w-full transition-all duration-500"></div>
          </div>

          <!-- Password Input -->
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-white/40 group-focus-within:text-primary transition-colors text-xl">lock</span>
            </div>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="Access Code"
              class="w-full bg-white/5 border border-white/10 text-white font-body-md text-body-md rounded-xl py-3.5 pl-12 pr-4 focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-white/30"
            />
            <div class="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary/0 group-focus-within:via-primary/50 to-transparent w-full transition-all duration-500"></div>
          </div>

          <!-- Terms Checkbox -->
          <div class="flex items-center mt-2 pl-1">
            <input
              id="terms"
              v-model="form.agreedToTerms"
              type="checkbox"
              required
              class="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
            />
            <label class="ml-3 font-body-md text-sm text-white/60 cursor-pointer" for="terms">
              I agree to the
              <a class="text-primary hover:text-primary-fixed hover:drop-shadow-[0_0_5px_rgba(255,180,169,0.5)] transition-all" href="#">Flight Terms</a>
            </label>
          </div>

          <!-- Action Button -->
          <button
            type="submit"
            class="w-full mt-lg py-4 rounded-xl bg-primary text-[#4a0002] font-headline-md text-headline-md hover:bg-white transition-all duration-300 active:scale-95 shadow-[0_0_30px_rgba(255,180,169,0.3)] hover:shadow-[0_0_40px_rgba(255,180,169,0.6)] flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            JOIN SQUADRON
            <span class="material-symbols-outlined transition-transform group-hover:translate-x-2">arrow_forward</span>
          </button>
        </form>

        <!-- Footer Action -->
        <div class="text-center pt-md mt-sm border-t border-white/10">
          <a
            class="font-body-md text-sm text-white/50 hover:text-white transition-colors inline-flex items-center gap-2 group"
            href="#"
            @click.prevent="goToSignIn"
          >
            Already a Pilot?
            <span class="text-primary group-hover:text-primary-fixed group-hover:drop-shadow-[0_0_8px_rgba(255,180,169,0.6)] transition-all">Log In</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  brandName: {
    type: String,
    default: "SKYCRASH",
  },
  tagline: {
    type: String,
    default: "Enlist for Deployment",
  },
  bgImageUrl: {
    type: String,
    default:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ui7Cew4P4cL6P_urE2uJIGxksdYiuYtek1gGZFfexlJHQ5kut6hRB1WhJ050HC5_Y6XmuM4g4rh9cbHfXPve3SrCk9rwLgjaj219zFUuxpEDZWV5hRoDhWrt-NHbmShq4F2qjwoYawfGlho3_ZRM_VtqARorwpEtRxAp9VJCiWbFfIr1JPAEjlWVE078Tx1r1TQm17EnBvK-TQeAJnvccStSwZ7wOYzx3JbjcORiWg_IA4lPX80y",
  },
})

const form = reactive({
  pilotName: "",
  email: "",
  password: "",
  agreedToTerms: false,
})

const handleSubmit = () => {
  if (form.pilotName && form.email && form.password && form.agreedToTerms) {
    router.push('/sign-in')
  }
}

const goToSignIn = () => {
  router.push('/sign-in')
}
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

.material-symbols-outlined.fill {
  font-variation-settings: "FILL" 1;
}
</style>
