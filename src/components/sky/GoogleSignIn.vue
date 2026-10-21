<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { en } from '@/copy/en'

/**
 * "Sign in with Google", only rendered when the server publishes a client id. The Google
 * Identity Services script is loaded on demand (first time this mounts) and draws its own
 * button; the credential (an ID token) is handed to the parent, which posts it to
 * POST /api/auth/google.
 */
const props = defineProps<{ clientId: string }>()
const emit = defineEmits<{ credential: [idToken: string]; error: [] }>()

interface GoogleId {
  initialize(opts: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }): void
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void
}
type GoogleWindow = Window & { google?: { accounts?: { id?: GoogleId } } }

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if ((window as GoogleWindow).google?.accounts?.id) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = SCRIPT_SRC
    el.async = true
    el.defer = true
    el.onload = () => resolve()
    el.onerror = () => {
      scriptPromise = null
      reject(new Error('gsi'))
    }
    document.head.appendChild(el)
  })
  return scriptPromise
}

const host = ref<HTMLElement | null>(null)
const failed = ref(false)

onMounted(async () => {
  try {
    await loadScript()
    const gid = (window as GoogleWindow).google?.accounts?.id
    if (!gid || !host.value) throw new Error('gsi')
    gid.initialize({
      client_id: props.clientId,
      callback: (r) => (r.credential ? emit('credential', r.credential) : emit('error')),
    })
    gid.renderButton(host.value, { theme: 'filled_black', size: 'large', shape: 'rectangular', text: 'signin_with', width: 280 })
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <div class="flex min-h-11 flex-col items-center">
    <div ref="host" :aria-label="en.login.google" class="max-w-full overflow-hidden" />
    <p v-if="failed" class="text-xs text-muted-foreground">{{ en.login.googleFailed }}</p>
  </div>
</template>
