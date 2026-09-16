<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import ArcadeField from "@/components/sky/ArcadeField.vue";
import CRTOverlay from "@/components/sky/CRTOverlay.vue";
import SkyEnvironment from "@/components/sky/SkyEnvironment.vue";
import Wordmark from "@/components/sky/Wordmark.vue";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/lib/api";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function onSubmit() {
  if (!username.value || !password.value) {
    error.value = "Flight system error — check your credentials.";
    return;
  }
  error.value = "";
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/play";
    router.push(redirect);
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Login failed — try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 py-12">
    <SkyEnvironment skin="sunset-runway" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <Wordmark compact />
      </div>

      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="onSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-magenta text-glow-magenta">
          Welcome Back, Pilot
        </h1>
        <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Cleared for boarding
        </p>

        <div class="mt-7 space-y-4">
          <ArcadeField v-model="username" label="Username" name="username" autocomplete="username" placeholder="pilot_name" />
          <ArcadeField
            v-model="password"
            label="Password"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" role="alert" class="mt-4 font-arcade text-[8px] uppercase leading-relaxed text-danger">
          {{ error }}
        </p>

        <div class="mt-5 flex items-center justify-between text-xs">
          <label class="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" class="accent-[var(--neon-magenta)]" /> Remember me
          </label>
          <button type="button" class="text-electric hover:text-glow-blue">Forgot password?</button>
        </div>

        <ArcadeButton type="submit" size="lg" variant="primary" class="mt-7 w-full" :disabled="loading">
          {{ loading ? "Preparing Aircraft…" : "Login" }}
        </ArcadeButton>

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          New here?
          <RouterLink to="/signup" class="text-lime hover:text-glow-lime">Create account</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
