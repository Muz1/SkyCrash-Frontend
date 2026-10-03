<script setup lang="ts">
import { nextTick, ref } from 'vue'
import axios from 'axios'
import { Bot, Lightbulb, Send, User } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import { useReport } from '@/composables/useReport'
import { getAdvisorRecommendations, askAdvisor } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import type { AdvisorChatMessage } from '@/types/insights'

// Recommended changes for the selected dates, and a chat to ask follow-up questions.
const { query, data, loading, error } = useReport(getAdvisorRecommendations)
const impactTone = { High: 'danger', Medium: 'warning', Low: 'neutral' } as const

const SUGGESTIONS = [
  'Why might players be leaving?',
  'Is the house edge set right?',
  'What should we build next?',
]
const messages = ref<AdvisorChatMessage[]>([])
const draft = ref('')
const asking = ref(false)
const chatError = ref<string | null>(null)
const log = ref<HTMLElement | null>(null)

async function ask(text?: string) {
  const question = (text ?? draft.value).trim()
  if (!question || asking.value) return
  messages.value.push({ role: 'user', text: question })
  draft.value = ''
  asking.value = true
  chatError.value = null
  await scrollDown()
  try {
    messages.value.push({ role: 'assistant', text: await askAdvisor(messages.value, query.value) })
  } catch (err: unknown) {
    const m = axios.isAxiosError(err)
      ? (err.response?.data as { message?: string })?.message
      : undefined
    chatError.value = m ?? 'The advisor could not answer. Please try again.'
    messages.value.pop()
    draft.value = question
  } finally {
    asking.value = false
    await scrollDown()
  }
}

async function scrollDown() {
  await nextTick()
  log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="AI Advisor"
    eyebrow="Feedback"
    subtitle="Recommended changes based on your players' behaviour and feedback, and a chat to dig deeper."
    :about="ABOUT.advisor!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <AdminPanel
        title="Recommended changes"
        :caption="`${data.recommendations.length} for this period`"
        accent="magenta"
      >
        <template #actions>
          <AdminPill
            :label="data.source === 'gemini' ? 'Gemini AI' : 'Rule-based (no AI key set)'"
            :tone="data.source === 'gemini' ? 'accent' : 'neutral'"
            :dot="false"
          />
        </template>
        <ol class="flex flex-col gap-4">
          <li
            v-for="(r, i) in data.recommendations"
            :key="i"
            class="rounded-[var(--adm-radius-sm)] border border-[var(--adm-border)] bg-[var(--adm-surface-2)] p-4"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="adm-num text-[1rem] text-[var(--adm-text-3)]">{{ i + 1 }}.</span>
              <Lightbulb class="h-5 w-5 text-[var(--neon-orange)]" aria-hidden="true" />
              <h3 class="min-w-0 flex-1 text-[1.125rem] font-bold text-[var(--adm-text)]">
                {{ r.title }}
              </h3>
              <AdminPill :label="`${r.impact} impact`" :tone="impactTone[r.impact] ?? 'neutral'" />
              <AdminPill :label="r.area" tone="neutral" :dot="false" />
            </div>
            <p class="mt-2 text-[0.9375rem] leading-relaxed text-[var(--adm-text-2)]">
              <strong>Why:</strong> {{ r.why }}
            </p>
            <p class="mt-1 text-[0.9375rem] leading-relaxed text-[var(--adm-text)]">
              <strong>Do this:</strong> {{ r.action }}
            </p>
            <ul v-if="r.evidence.length" class="mt-2 space-y-1">
              <li
                v-for="e in r.evidence"
                :key="e"
                class="text-[0.875rem] italic text-[var(--adm-text-3)]"
              >
                “{{ e }}”
              </li>
            </ul>
          </li>
        </ol>
      </AdminPanel>

      <div class="adm-grid-2">
        <AdminPanel
          title="Ask the advisor"
          caption="Answers use the numbers for this period"
          accent="blue"
        >
          <p v-if="!data.aiAvailable" class="adm-callout">
            <span>
              Chat needs a Gemini API key. Add one as <strong>Gemini:ApiKey</strong> in the API's appsettings.json (or user secrets) and
              restart the API. The recommendations above still work without it.
            </span>
          </p>
          <template v-else>
            <div
              ref="log"
              class="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1"
              aria-live="polite"
            >
              <p v-if="messages.length === 0" class="text-[0.9375rem] text-[var(--adm-text-3)]">
                Ask anything about these numbers or the feedback.
              </p>
              <div
                v-for="(m, i) in messages"
                :key="i"
                :class="['flex gap-2', m.role === 'user' ? 'flex-row-reverse text-right' : '']"
              >
                <component
                  :is="m.role === 'user' ? User : Bot"
                  class="mt-1 h-5 w-5 shrink-0 text-[var(--adm-text-3)]"
                  aria-hidden="true"
                />
                <p
                  :class="[
                    'max-w-[85%] whitespace-pre-wrap rounded-[var(--adm-radius-sm)] px-3 py-2 text-left text-[0.9375rem] leading-relaxed',
                    m.role === 'user'
                      ? 'bg-[var(--adm-accent)] text-white'
                      : 'bg-[var(--adm-surface-2)] text-[var(--adm-text)]',
                  ]"
                >
                  <span class="sr-only">{{ m.role === 'user' ? 'You: ' : 'Advisor: ' }}</span
                  >{{ m.text }}
                </p>
              </div>
              <p v-if="asking" class="flex items-center gap-2 text-[0.9375rem] text-[var(--adm-text-3)]">
                <Bot class="h-5 w-5" aria-hidden="true" /> Thinking…
              </p>
            </div>
            <div v-if="messages.length === 0" class="mt-3 flex flex-wrap gap-2">
              <AdminButton v-for="s in SUGGESTIONS" :key="s" variant="secondary" @click="ask(s)">{{
                s
              }}</AdminButton>
            </div>
            <p v-if="chatError" role="alert" class="adm-error mt-3">{{ chatError }}</p>
            <form class="mt-3 flex gap-2" @submit.prevent="ask()">
              <input
                v-model="draft"
                class="adm-input min-w-0 flex-1"
                maxlength="1000"
                placeholder="e.g. Which reward costs us the most?"
                aria-label="Ask the advisor"
              />
              <AdminButton type="submit" variant="primary" :disabled="asking || !draft.trim()"
                ><Send aria-hidden="true" /> Ask</AdminButton
              >
            </form>
          </template>
        </AdminPanel>

        <AdminPanel
          title="What the advisor looked at"
          :caption="`${data.range.days} day${data.range.days === 1 ? '' : 's'}`"
          accent="violet"
        >
          <dl class="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-[0.9375rem]">
            <template v-for="f in data.facts" :key="f.label">
              <dt class="text-[var(--adm-text-3)]">{{ f.label }}</dt>
              <dd class="adm-num text-right font-bold text-[var(--adm-text)]">{{ f.value }}</dd>
            </template>
          </dl>
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
