<script setup lang="ts">
import { ref } from 'vue'
import ArcadeButton from './ArcadeButton.vue'
import * as rulesService from '@/services/rulesService'
import { apiMessage } from '@/lib/apiError'
import { en } from '@/copy/en'

/**
 * Appeal a sanction (POST /api/rules/appeals). Signed in, the session identifies the player;
 * from the blocked-login screen the one-time appeal token does.
 */
const props = defineProps<{ sanctionId: string; appealToken?: string | null; pending?: boolean }>()
const emit = defineEmits<{ sent: [] }>()
const t = en.blocked

const message = ref('')
const sending = ref(false)
const sent = ref(!!props.pending)
const error = ref<string | null>(null)
const fieldId = `appeal-${props.sanctionId}`

async function submit() {
  error.value = null
  const text = message.value.trim()
  if (text.length < 5) {
    error.value = t.appealTooShort
    return
  }
  sending.value = true
  try {
    await rulesService.submitAppeal({ sanctionId: props.sanctionId, message: text, appealToken: props.appealToken ?? undefined })
    sent.value = true
    emit('sent')
  } catch (err) {
    error.value = apiMessage(err) ?? en.common.tryAgain
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <p v-if="sent" class="text-sm font-semibold text-lime" role="status">{{ props.pending ? t.appealPending : t.appealSent }}</p>
  <form v-else class="space-y-2" @submit.prevent="submit">
    <label :for="fieldId" class="block font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.appealTitle }}</label>
    <textarea
      :id="fieldId"
      v-model="message"
      rows="3"
      maxlength="500"
      :placeholder="t.appealHint"
      class="clip-hud block w-full resize-y border-2 border-violet/50 bg-void/70 px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-magenta focus:outline-none"
    />
    <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
    <ArcadeButton type="submit" size="md" variant="magenta" :disabled="sending">{{ sending ? en.common.saving : t.appealSend }}</ArcadeButton>
  </form>
</template>
