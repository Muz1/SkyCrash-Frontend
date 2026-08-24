<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
    <h1 class="text-4xl font-bold tracking-tight">SkyCrash</h1>
    <p class="mt-2 text-slate-400">Frontend foundation is running.</p>
    <RouterView />
  </div>
</template>