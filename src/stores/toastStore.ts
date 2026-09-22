import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  title: string
  message: string
  accent: 'lime' | 'ember' | 'magenta' | 'blue'
  imageSrc?: string | null
}

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function push(toast: Omit<Toast, 'id'>, durationMs = 5000) {
    const id = nextId++
    toasts.value = [...toasts.value, { ...toast, id }]
    setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, dismiss }
})
