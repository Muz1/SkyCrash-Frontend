<script setup lang="ts">
import { LifeBuoy, Phone, Globe } from '@lucide/vue'
import NeonPanel from './NeonPanel.vue'
import { en } from '@/copy/en'

/**
 * South Africa's National Responsible Gambling Programme: hotline and website. `compact` is one
 * line for the landing page (which must fit one screen); the default is a profile panel.
 */
defineProps<{ compact?: boolean }>()
const t = en.helpline
</script>

<template>
  <p v-if="compact" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-foreground/85">
    <LifeBuoy class="h-3.5 w-3.5 text-ember" aria-hidden="true" />
    <span>{{ t.ageLine }} · {{ t.org }}:</span>
    <a :href="t.tel" class="font-semibold text-ember underline-offset-2 hover:underline pointer-coarse:py-2">{{ t.phone }}</a>
    <a :href="t.url" target="_blank" rel="noopener noreferrer" class="font-semibold text-electric underline-offset-2 hover:underline pointer-coarse:py-2">{{ t.site }}</a>
  </p>

  <NeonPanel v-else :title="t.title" accent="ember">
    <p class="text-sm text-foreground/85">{{ t.org }}. {{ t.body }}</p>
    <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <a :href="t.tel" class="inline-flex items-center gap-1.5 font-semibold text-ember underline-offset-2 hover:underline pointer-coarse:min-h-11">
        <Phone class="h-4 w-4" aria-hidden="true" /> {{ t.phone }}
      </a>
      <a :href="t.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 font-semibold text-electric underline-offset-2 hover:underline pointer-coarse:min-h-11">
        <Globe class="h-4 w-4" aria-hidden="true" /> {{ t.site }}
      </a>
      <span class="inline-flex items-center text-muted-foreground">WhatsApp {{ t.whatsapp }}</span>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">{{ t.ageLine }}</p>
  </NeonPanel>
</template>
