import { ref, watch } from 'vue'
import axios from 'axios'
import type { ReportQuery } from '@/types/insights'

// One date range for the whole dashboard: picking "This week" on one report keeps it when
// moving to the next. Module-level so every report page shares it.
const sharedQuery = ref<ReportQuery>({ range: 'month' })

/**
 * Loads a report for the shared date range and reloads when the range changes. While a
 * reload is in flight the previous data stays on screen (no skeleton flash).
 */
export function useReport<T>(fetcher: (q: ReportQuery) => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const q = sharedQuery.value
    if (q.range === 'custom' && (!q.from || !q.to)) return
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher({ ...q })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
      error.value = message ?? 'This report could not be loaded. Check the API is running and try again.'
    } finally {
      loading.value = false
    }
  }

  watch(sharedQuery, load, { deep: true, immediate: true })

  return { query: sharedQuery, data, loading, error, reload: load }
}
