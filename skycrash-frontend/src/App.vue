<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavBar from './components/AppNavBar.vue'
import { useSignalRConnection } from '@/composables/useSignalRConnection'

useSignalRConnection()
</script>

<template>
  <div>
    <AppNavBar />
    <RouterView />
  </div>
</template>