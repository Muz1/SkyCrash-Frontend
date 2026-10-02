<script setup lang="ts">
defineProps<{ title: string; eyebrow?: string; subtitle?: string }>()
</script>

<template>
  <div class="adm-page">
    <header class="adm-page-header">
      <div class="min-w-0">
        <p v-if="eyebrow" class="adm-eyebrow">{{ eyebrow }}</p>
        <h1 class="adm-title">{{ title }}</h1>
        <p v-if="subtitle" class="adm-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="adm-page-actions"><slot name="actions" /></div>
    </header>
    <div class="adm-page-body"><slot /></div>
  </div>
</template>
