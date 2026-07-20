<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavBar from './components/AppNavBar.vue'
</script>

<template>
  <div>
    <AppNavBar />
    <RouterView />
  </div>
</template>