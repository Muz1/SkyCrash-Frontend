<script setup lang="ts">
import { cn } from '@/lib/cn'
import { useTextSize } from '@/composables/useTextSize'
import { polishCopy } from '@/copy/polish'

/** Accessibility: a 100 / 125 / 150% text-size switch (radio group), saved on this device. */
const { size, sizes, set } = useTextSize()
const copy = polishCopy.a11y
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="font-arcade text-[0.5625rem] uppercase leading-tight text-foreground">{{ copy.textSize }}</legend>
    <p class="mt-1 text-xs leading-tight text-[#c4b5fd]">{{ copy.textSizeHint }}</p>
    <div class="mt-2 grid grid-cols-3 gap-2">
      <label
        v-for="s in sizes"
        :key="s"
        :class="
          cn(
            'flex min-h-11 cursor-pointer items-center justify-center border-2 font-arcade text-[0.5625rem] transition-colors focus-within:ring-2 focus-within:ring-electric',
            size === s ? 'border-electric bg-electric/15 text-electric' : 'border-violet/60 text-foreground hover:border-electric',
          )
        "
      >
        <input type="radio" name="text-size" class="sr-only" :value="s" :checked="size === s" @change="set(s)" />
        {{ s }}%
      </label>
    </div>
  </fieldset>
</template>
