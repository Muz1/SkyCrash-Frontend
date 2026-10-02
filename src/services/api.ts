import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skycrash_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // A 401 on anything but the login/register calls means the session expired
    // (or was revoked): end it properly instead of leaving the UI looking logged in.
    const isAuthCall = String(error.config?.url ?? '').includes('/auth/')
    if (error.response?.status === 401 && !isAuthCall) {
      const [{ useAuthStore }, { usePlayerStore }, { default: router }] = await Promise.all([
        import('@/stores/AuthStore'),
        import('@/stores/playerStore'),
        import('@/router'),
      ])
      useAuthStore().logout()
      usePlayerStore().clear()
      const current = router.currentRoute.value
      if (current.meta.requiresAuth) {
        router.push({ name: 'login', query: { redirect: current.fullPath, expired: '1' } })
      }
    }
    return Promise.reject(error)
  }
)

export default api