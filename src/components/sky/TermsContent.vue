<script setup lang="ts">
import { TERMS_IS_DRAFT, TERMS_SECTIONS, TERMS_VERSION } from '@/lib/terms'

/** The Terms of Service text, shared by the /terms page and the sign-up modal. */
</script>

<template>
  <div class="text-left">
    <p class="font-arcade text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
      Version {{ TERMS_VERSION }}
    </p>
    <p
      v-if="TERMS_IS_DRAFT"
      class="mt-2 border border-ember/60 bg-ember/10 px-2 py-1 text-xs text-foreground"
    >
      Draft terms for the Sky Crash project. Final wording to come.
    </p>
    <section v-for="s in TERMS_SECTIONS" :key="s.heading" class="mt-4">
      <h3 class="font-display text-sm font-black uppercase tracking-[0.14em] text-electric">
        {{ s.heading }}
      </h3>
      <p class="mt-1 text-sm leading-relaxed text-foreground/90">{{ s.body }}</p>
    </section>
  </div>
</template>
