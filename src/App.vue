<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSignalRConnection } from '@/composables/useSignalRConnection'
import ToastStack from '@/components/sky/ToastStack.vue'
import BadgeViewer from '@/components/sky/BadgeViewer.vue'

useSignalRConnection()
</script>

<template>
  <RouterView />
  <ToastStack />
  <BadgeViewer />
</template>
