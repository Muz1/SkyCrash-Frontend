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
            <span class="material-symbols-outlined text-xl">rocket_launch</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-8 flex items-center justify-center space-x-4">
          <div class="h-px bg-white/10 flex-1"></div>
          <span class="font-label-mono text-xs text-on-surface-variant uppercase tracking-widest">Or Link Systems</span>
          <div class="h-px bg-white/10 flex-1"></div>
        </div>

        <!-- Social Logins -->
        <div class="mt-6 grid grid-cols-2 gap-4">
          <button
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-DEFAULT bg-white/5 hover:bg-white/10 border border-white/10 transition-all group backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]"
            @click="$emit('social-login', 'google')"
          >
            <img
              alt="Google"
              class="w-5 h-5 group-hover:scale-110 transition-transform drop-shadow-md"
              :src="googleIconUrl"
            />
            <span class="font-label-mono text-label-mono text-white">Google</span>
          </button>
          <button
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-DEFAULT bg-white/5 hover:bg-white/10 border border-white/10 transition-all group backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]"
            @click="$emit('social-login', 'apple')"
          >
            <span class="material-symbols-outlined text-white group-hover:scale-110 transition-transform drop-shadow-md">
              file_download
            </span>
            <span class="font-label-mono text-label-mono text-white">Apple</span>
          </button>
        </div>
      </div>

      <!-- Footer Link -->
      <div class="mt-8 text-center">
        <p class="font-body-md text-body-md text-on-surface-variant">
          Unregistered Pilot?
          <a
            class="text-primary hover:text-primary-fixed hover:drop-shadow-[0_0_8px_rgba(255,180,169,0.6)] font-semibold transition-all underline decoration-primary/30 underline-offset-4"
            href="#"
            @click.prevent="$emit('create-account')"
          >
            Create Account
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "SkyCrashSignIn",
  props: {
    brandName: {
      type: String,
      default: "SKYCRASH",
    },
    tagline: {
      type: String,
      default: "Initialize Pre-Flight Sequence",
    },
    bgImageUrl: {
      type: String,
      default:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAzx6c48h2PUaDftgmz5v2H0QXlpK1Jog7hqEB8T79hyRepek7Glsveo5iMQe3i-JzmyQyOusO1VdPGnPzQ984NZIgDAbiAHPLByyR0L4XB0mgFhjRaGllSG5DK1dgfoMTaQV41hennyYrIuvZh_1l4S7QIY1zKcaAgdiS3cPGlu4yPnanhQp1Q1IE-LBiT-k1cfz2TWwEseGhHmrQGFdGzjGNz6-hw-igkAWOdllWLYfIwUF_5nXjX",
    },
    googleIconUrl: {
      type: String,
      default:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCy9gdkPQHQ8EjxDrfjGU-6ODvyhMeqadsJBNO4qq3pNYwvTGw2k9Nu_5l2c4sE7pKA-u9kgeQ3XJsnEbzYqKKYt5hbQUg0PpEo0ZfHoQnJZW8sbl0HXxAaS3LIfsuvIFL5ZkZWlFi4xzB--ljM9l87AiVLlhtLEfppvYbytm1kz074heiQpHGs6joGgFPakIXgPLcEHYdqwiwN4MVtWky6QAHr9P4K2nTH2zXSBxS39a0agpNwXts5",
    },
  },
  emits: ["login", "forgot-password", "social-login", "create-account"],
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
    };
  },
  methods: {
    handleSubmit() {
      this.$emit("login", { email: this.email, password: this.password });
    },
  },
};
</script>

<style scoped>
.glass-panel {
  background-color: rgba(33, 14, 12, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 180, 169, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
}

.input-glow:focus-within {
  box-shadow: 0 1px 16px rgba(255, 180, 169, 0.4);
  border-bottom-color: #ffb4a9;
}
</style>

<style>
/* Unscoped: needs to apply to the real <body> element, which a scoped
   style block cannot reach. Import once globally (e.g. root App.vue)
   rather than per page instance. */
body {
  min-height: max(884px, 100dvh);
}
</style>