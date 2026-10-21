<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MailWarning, ScrollText, X } from '@lucide/vue'
import RulesReviewModal from './RulesReviewModal.vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useRulesStore } from '@/stores/rulesStore'
import { useResendVerification } from '@/composables/useResendVerification'
import { en } from '@/copy/en'

/**
 * One-line account notices under the top bar: "Verify email" (with Resend) and
 * "Rules updated" (opens the review step). Players only; each line can be hidden for the
 * session so it never crowds the game screen.
 */
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const rulesStore = useRulesStore()
const { resend, sending, message } = useResendVerification()

const EMAIL_KEY = 'skycrash_hide_verify_banner'
const emailHidden = ref(readHidden())
const reviewing = ref(false)

function readHidden() {
  try {
    return sessionStorage.getItem(EMAIL_KEY) === '1'
  } catch {
    return false
  }
}
function hideEmail() {
  emailHidden.value = true
  try {
    sessionStorage.setItem(EMAIL_KEY, '1')
  } catch {
    // Non-fatal.
  }
}

const isPlayer = computed(() => authStore.isAuthenticated && !!playerStore.profile && !playerStore.profile.isAdmin)
const showEmail = computed(() => isPlayer.value && playerStore.profile?.emailVerified === false && !emailHidden.value)
const showRules = computed(() => isPlayer.value && rulesStore.mustAccept)

function loadStanding() {
  if (isPlayer.value && !rulesStore.standing) void rulesStore.loadStanding()
}
onMounted(loadStanding)
watch(isPlayer, loadStanding)
</script>

<template>
  <div v-if="showEmail || showRules" class="relative z-20 shrink-0 space-y-1 pb-1 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))]">
    <div v-if="showRules" class="clip-hud mx-auto flex max-w-[64rem] items-center gap-2 border-2 border-magenta/70 bg-void/85 px-2 py-0.5 text-sm" role="status">
      <ScrollText class="h-4 w-4 shrink-0 text-magenta" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">{{ en.rules.updatedBanner }}</span>
      <button
        type="button"
        class="shrink-0 font-display text-[0.625rem] font-black uppercase tracking-[0.14em] text-magenta underline-offset-2 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        @click="reviewing = true"
      >
        {{ en.rules.viewChanges }}
      </button>
    </div>
    <div v-if="showEmail" class="clip-hud mx-auto flex max-w-[64rem] items-center gap-2 border-2 border-ember/70 bg-void/85 px-2 py-0.5 text-sm" role="status">
      <MailWarning class="h-4 w-4 shrink-0 text-ember" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">{{ message ?? en.verifyEmail.banner }}</span>
      <button
        type="button"
        class="shrink-0 font-display text-[0.625rem] font-black uppercase tracking-[0.14em] text-ember underline-offset-2 hover:underline disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        :disabled="sending"
        @click="resend"
      >
        {{ en.verifyEmail.resend }}
      </button>
      <button
        type="button"
        :aria-label="en.verifyEmail.dismiss"
        class="grid h-6 w-6 shrink-0 place-items-center text-muted-foreground hover:text-foreground pointer-coarse:h-11 pointer-coarse:w-11"
        @click="hideEmail"
      >
        <X class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
    <RulesReviewModal v-if="reviewing" @close="reviewing = false" />
  </div>
</template>
