<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <div class="adm-state" role="status">
    <span class="adm-spinner" aria-hidden="true" />
    <span>{{ text ?? 'Loading…' }}</span>
  </div>
</template>
