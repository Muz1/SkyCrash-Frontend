<script setup lang="ts">
import PageExportButton from './PageExportButton.vue'

/**
 * Every admin page gets an "Export PDF" button that captures the page as shown. Pages with
 * their own structured data export (e.g. Player Management) turn it off with :page-export="false".
 */
withDefaults(
  defineProps<{ title: string; eyebrow?: string; subtitle?: string; pageExport?: boolean }>(),
  {
    pageExport: true,
  },
)
</script>

<template>
  <div class="adm-page">
    <header class="adm-page-header">
      <div class="min-w-0">
        <p v-if="eyebrow" class="adm-eyebrow">{{ eyebrow }}</p>
        <h1 class="adm-title">{{ title }}</h1>
        <p v-if="subtitle" class="adm-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions || pageExport" class="adm-page-actions">
        <slot name="actions" />
        <PageExportButton v-if="pageExport" :title="title" />
      </div>
    </header>
    <div class="adm-page-body"><slot /></div>
  </div>
</template>
