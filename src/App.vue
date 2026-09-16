<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSignalRConnection } from '@/composables/useSignalRConnection'

useSignalRConnection()
</script>

<template>
  <RouterView />
</template>
