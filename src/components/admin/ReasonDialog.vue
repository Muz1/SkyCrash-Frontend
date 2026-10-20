<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { CircleAlert, MessageSquareText } from '@lucide/vue'
import AdminDialog from './AdminDialog.vue'
import AdminButton from './AdminButton.vue'

/** Asks for a reason / response before an action (unblock, lift, resolve an appeal). */
const props = withDefaults(
  defineProps<{
    title: string
    sub?: string
    label?: string
    confirm?: string
    placeholder?: string
    required?: boolean
    tone?: string
    variant?: 'primary' | 'success' | 'danger-solid'
  }>(),
  { label: 'Reason', confirm: 'Confirm', placeholder: '', required: true, tone: '#3b82f6', variant: 'primary' },
)
const emit = defineEmits<{ close: []; submit: [text: string] }>()

const text = ref('')
const error = ref('')

function submit() {
  error.value = ''
  if (props.required && !text.value.trim()) {
    error.value = `${props.label} is required.`
    return
  }
  emit('submit', text.value.trim())
}

defineExpose({
  fail(err: unknown) {
    error.value =
      (axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined) ?? 'That did not work. Try again.'
  },
})
</script>

<template>
  <AdminDialog :title="title" :sub="sub" :tone="tone" @close="emit('close')">
    <template #icon><MessageSquareText /></template>
    <slot />
    <label class="block">
      <span class="adm-label">{{ label }}{{ required ? '' : ' (optional)' }}</span>
      <textarea v-model="text" maxlength="500" class="adm-textarea" :placeholder="placeholder" />
    </label>
    <p v-if="error" class="adm-error" role="alert"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>
    <template #footer>
      <AdminButton variant="ghost" @click="emit('close')">Cancel</AdminButton>
      <AdminButton :variant="variant" @click="submit">{{ confirm }}</AdminButton>
    </template>
  </AdminDialog>
</template>
