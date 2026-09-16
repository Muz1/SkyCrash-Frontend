<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import ArcadeField from "@/components/sky/ArcadeField.vue";
import CRTOverlay from "@/components/sky/CRTOverlay.vue";
import SkyEnvironment from "@/components/sky/SkyEnvironment.vue";
import Wordmark from "@/components/sky/Wordmark.vue";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/lib/api";

const auth = useAuthStore();
const router = useRouter();

const username = ref("");
const email = ref("");
const password = ref("");
const confirm = ref("");
const loading = ref(false);
const error = ref("");

async function onSubmit() {
  if (password.value !== confirm.value) {
    error.value = "Passwords do not match.";
    return;
  }
  error.value = "";
  loading.value = true;
  try {
    await auth.register(username.value, email.value, password.value);
    router.push("/play");
  } catch (err) {
    if (err instanceof ApiError) {
      error.value = err.errors?.join(" ") || err.message;
    } else {
      error.value = "Signup failed — try again.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 py-12">
    <SkyEnvironment skin="cloud-city" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <Wordmark compact />
      </div>

      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="onSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-lime text-glow-lime">
          Join The Flight
        </h1>
        <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Register your call sign
        </p>

        <div class="mt-7 space-y-4">
          <ArcadeField v-model="username" label="Username" name="username" placeholder="pilot_name" />
          <ArcadeField v-model="email" label="Email" name="email" type="email" placeholder="pilot@skycrash.io" />
          <div>
            <ArcadeField v-model="password" label="Password" name="password" type="password" placeholder="••••••••" />
            <p class="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              8+ characters, one uppercase letter, one number
            </p>
          </div>
          <ArcadeField
            v-model="confirm"
            label="Confirm Password"
            name="confirm"
            type="password"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" role="alert" class="mt-4 font-arcade text-[8px] uppercase leading-relaxed text-danger">
          {{ error }}
        </p>

        <label class="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" required class="accent-[var(--neon-lime)]" />I agree to the flight terms
        </label>

        <ArcadeButton type="submit" size="lg" variant="cash" class="mt-6 w-full" :disabled="loading">
          {{ loading ? "Establishing Flight Path…" : "Create Account" }}
        </ArcadeButton>

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Already a pilot?
          <RouterLink to="/login" class="text-electric hover:text-glow-blue">Login</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
