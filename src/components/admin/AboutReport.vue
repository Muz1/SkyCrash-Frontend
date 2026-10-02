<script setup lang="ts">
import { ChevronDown, Info } from '@lucide/vue'

/**
 * "ⓘ About this report": a collapsed explainer at the top of every report. Says what the
 * report measures, what the numbers mean, how to read the charts and what to use it for.
 */
defineProps<{
  measures: string
  numbers: { term: string; definition: string }[]
  charts: string
  useFor: string
}>()
</script>

<template>
  <details class="adm-about">
    <summary>
      <Info aria-hidden="true" />
      <span>About this report</span>
      <ChevronDown class="adm-about-chevron" aria-hidden="true" />
    </summary>
    <div class="adm-about-body">
      <section>
        <h3>What it measures</h3>
        <p>{{ measures }}</p>
      </section>
      <section>
        <h3>What the numbers mean</h3>
        <dl>
          <div v-for="n in numbers" :key="n.term">
            <dt>{{ n.term }}</dt>
            <dd>{{ n.definition }}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>How to read the charts</h3>
        <p>{{ charts }}</p>
      </section>
      <section>
        <h3>What to use it for</h3>
        <p>{{ useFor }}</p>
      </section>
    </div>
  </details>
</template>
