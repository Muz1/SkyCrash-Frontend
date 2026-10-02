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

  it('lands an unauthenticated visitor on the public home page', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
    expect(wrapper.text()).toContain('Play Sky Crash')
    expect(wrapper.text()).toContain('Create Account')
  })

  it('asks an unauthenticated visitor to log in when they choose Play', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    await router.push('/game')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/game')
    expect(wrapper.text()).toContain('Welcome Back, Pilot')
  })
})
