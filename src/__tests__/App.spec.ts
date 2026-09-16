import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // AuthStore reads localStorage at store-creation time. Depending on the
    // Node/jsdom combination running the tests, the global `localStorage`
    // isn't always a real Storage implementation, so stub a minimal one —
    // this test only cares about routing/rendering, not persisted auth state.
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
  })

  it('mounts and redirects an unauthenticated visitor to the login screen', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    await router.isReady()

    expect(wrapper.text()).toContain('Welcome Back, Pilot')
  })
})
