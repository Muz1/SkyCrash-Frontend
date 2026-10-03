<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { CircleCheck, Plus, RotateCcw, Trash2, X } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import * as service from '@/services/adminAnalyticsService'
import type { FeedbackTheme } from '@/types/insights'

/**
 * The keyword themes used to group feedback when no AI key is set. A comment that uses any
 * of a theme's keywords counts towards it: under "improve" as a complaint, under "liked" as praise.
 */
const saved = ref<FeedbackTheme[] | null>(null)
const draft = ref<FeedbackTheme[]>([])
const newWord = ref<string[]>([])
const saving = ref(false)
const message = ref<{ ok: boolean; text: string } | null>(null)
const dirty = computed(() => JSON.stringify(saved.value) !== JSON.stringify(draft.value))

function load(themes: FeedbackTheme[]) {
  saved.value = themes
  draft.value = themes.map((t) => ({ ...t, keywords: [...t.keywords] }))
  newWord.value = themes.map(() => '')
}

onMounted(async () => load(await service.getFeedbackThemes()))

function addWords(i: number) {
  const theme = draft.value[i]
  if (!theme) return
  for (const raw of (newWord.value[i] ?? '').split(/[,\s]+/)) {
    const word = raw.trim().toLowerCase()
    if (word && !theme.keywords.includes(word)) theme.keywords.push(word)
  }
  newWord.value[i] = ''
}

function addTheme() {
  draft.value.push({ title: 'New theme', keywords: [], fix: '', keep: '' })
  newWord.value.push('')
}

function removeTheme(i: number) {
  draft.value.splice(i, 1)
  newWord.value.splice(i, 1)
}

async function run(action: () => Promise<FeedbackTheme[]>, ok: string) {
  saving.value = true
  message.value = null
  try {
    load(await action())
    message.value = { ok: true, text: ok }
  } catch (err: unknown) {
    const m = axios.isAxiosError(err)
      ? (err.response?.data as { message?: string })?.message
      : undefined
    message.value = { ok: false, text: m ?? 'Could not save.' }
  } finally {
    saving.value = false
  }
}

const save = () =>
  run(() => service.saveFeedbackThemes(draft.value), 'Saved. AI Insights now uses these keywords.')
function reset() {
  if (confirm('Replace all themes with the built-in defaults?'))
    void run(service.resetFeedbackThemes, 'Restored the built-in themes.')
}
</script>

<template>
  <AdminShell>
    <AdminPage
      title="Feedback Keywords"
      eyebrow="Feedback"
      subtitle="How AI Insights groups written feedback into topics when no AI key is set."
    >
      <template #actions>
        <AdminButton variant="secondary" :disabled="saving" @click="reset"
          ><RotateCcw aria-hidden="true" /> Reset to defaults</AdminButton
        >
        <AdminButton variant="primary" :disabled="!dirty || saving" @click="save">{{
          saving ? 'Saving…' : 'Save keywords'
        }}</AdminButton>
      </template>

      <p class="adm-note">
        Each theme is a topic. A comment that uses any of its keywords counts towards it: in "What
        could we improve?" as a complaint, in "What do you like?" as praise. The topic card on AI
        Insights then shows the matching action below. With a Gemini key set, the AI groups feedback
        itself and these keywords are only a fallback.
      </p>
      <p
        v-if="message"
        role="status"
        :class="message.ok ? 'adm-success flex items-center gap-2' : 'adm-error'"
      >
        <CircleCheck v-if="message.ok" class="h-4 w-4" aria-hidden="true" />{{ message.text }}
      </p>

      <div v-if="saved" class="adm-grid-2">
        <AdminPanel v-for="(t, i) in draft" :key="i" accent="violet">
          <div class="flex items-center gap-2">
            <label class="min-w-0 flex-1">
              <span class="adm-label">Theme name</span>
              <input v-model="t.title" maxlength="40" class="adm-input w-full" />
            </label>
            <AdminButton
              variant="secondary"
              :aria-label="`Delete theme ${t.title}`"
              class="mt-6"
              @click="removeTheme(i)"
            >
              <Trash2 aria-hidden="true" />
            </AdminButton>
          </div>

          <p class="adm-label mt-4">Keywords</p>
          <ul class="mt-1 flex flex-wrap gap-1.5" :aria-label="`${t.title} keywords`">
            <li
              v-for="(k, ki) in t.keywords"
              :key="k"
              class="inline-flex items-center gap-1 rounded-full border border-[var(--adm-border-strong)] bg-[var(--adm-surface-2)] py-0.5 pl-3 pr-1 text-[0.875rem] text-[var(--adm-text)]"
            >
              {{ k }}
              <button
                type="button"
                :aria-label="`Remove ${k}`"
                class="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--adm-surface-3)]"
                @click="t.keywords.splice(ki, 1)"
              >
                <X class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
            <li v-if="t.keywords.length === 0" class="text-[0.875rem] text-[var(--adm-text-3)]">
              No keywords yet.
            </li>
          </ul>
          <form class="mt-2 flex gap-2" @submit.prevent="addWords(i)">
            <input
              v-model="newWord[i]"
              class="adm-input min-w-0 flex-1"
              placeholder="Add words, separated by commas"
              :aria-label="`Add keywords to ${t.title}`"
            />
            <AdminButton type="submit" variant="secondary"
              ><Plus aria-hidden="true" /> Add</AdminButton
            >
          </form>

          <label class="mt-4 block">
            <span class="adm-label">Action when players complain</span>
            <textarea v-model="t.fix" rows="2" maxlength="500" class="adm-input w-full" />
          </label>
          <label class="mt-3 block">
            <span class="adm-label">Action when players praise it</span>
            <textarea v-model="t.keep" rows="2" maxlength="500" class="adm-input w-full" />
          </label>
        </AdminPanel>

        <button
          type="button"
          class="grid min-h-40 place-items-center rounded-[var(--adm-radius)] border-2 border-dashed border-[var(--adm-border-strong)] text-[1rem] font-bold text-[var(--adm-text-2)] hover:border-[var(--neon-violet)] hover:text-[var(--adm-text)]"
          @click="addTheme"
        >
          <span class="flex items-center gap-2"
            ><Plus class="h-5 w-5" aria-hidden="true" /> Add a theme</span
          >
        </button>
      </div>
      <AdminLoading v-else />
    </AdminPage>
  </AdminShell>
</template>
