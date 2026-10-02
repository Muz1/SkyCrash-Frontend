<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'info' | 'success' | 'danger' | 'danger-solid'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'secondary', size: 'md', type: 'button', disabled: false },
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="['adm-btn', `adm-btn--${variant}`, size === 'sm' && 'adm-btn--sm']">
    <slot />
  </button>
</template>
