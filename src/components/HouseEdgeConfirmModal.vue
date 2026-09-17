<script setup lang="ts">
import { ref } from 'vue'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'

const props = defineProps<{ newHouseEdgePercentage: number }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const adminSettingsStore = useAdminSettingsStore()
const password = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function submit() {
  error.value = ''
  if (!password.value) {
    error.value = 'Enter your password to confirm this change.'
    return
  }

  isSubmitting.value = true
  try {
    await adminSettingsStore.updateHouseEdge(props.newHouseEdgePercentage, password.value)
    emit('saved')
  } catch (e: unknown) {
    const response = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: unknown } }).response : undefined
    const data = response?.data as Record<string, unknown> | undefined
    error.value = (data && typeof data.message === 'string' && data.message) || 'Incorrect password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
    <div class="neon-panel clip-hud w-full max-w-sm space-y-4 p-6">
      <h2 class="font-display text-sm font-black uppercase tracking-[0.2em] text-ember text-glow-ember">
        Confirm House Edge Change
      </h2>
      <p class="text-xs text-muted-foreground">
        You're about to set the house edge to <span class="text-ember">{{ newHouseEdgePercentage }}%</span>. Re-enter your
        password to confirm this affects real payouts for every player going forward.
      </p>

      <ArcadeField v-model="password" type="password" label="Your Password" autocomplete="current-password" />

      <p v-if="error" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <ArcadeButton size="sm" variant="ghost" @click="emit('close')">Cancel</ArcadeButton>
        <ArcadeButton size="sm" variant="danger" :disabled="isSubmitting" @click="submit">
          {{ isSubmitting ? 'Confirming…' : 'Confirm Change' }}
        </ArcadeButton>
      </div>
    </div>
  </div>
</template>
