<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavBar from './components/AppNavBar.vue'
import { useHeartbeat } from '@/composables/useHeartbeat'

useHeartbeat()
</script>

<template>
  <div>
    <AppNavBar />
    <RouterView />
  </div>
</template>