import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AdjustBalanceModal from './AdjustBalanceModal.vue'
import * as adminService from '@/services/adminService'

vi.mock('@/services/adminService')

describe('AdjustBalanceModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows a client-side error and does not call the API when amount is zero', async () => {
    const wrapper = mount(AdjustBalanceModal, {
      props: { playerId: 'test-id', username: 'testuser' },
    })

    await wrapper.find('button:last-of-type').trigger('click')

    expect(wrapper.text()).toContain('Amount cannot be zero')
    expect(adminService.adjustBalance).not.toHaveBeenCalled()
  })

  it('shows a client-side error and does not call the API when reason is empty', async () => {
    const wrapper = mount(AdjustBalanceModal, {
      props: { playerId: 'test-id', username: 'testuser' },
    })

    await wrapper.find('input[type="number"]').setValue(50)
    await wrapper.find('button:last-of-type').trigger('click')

    expect(wrapper.text()).toContain('A reason is required')
    expect(adminService.adjustBalance).not.toHaveBeenCalled()
  })

  it('calls the API and emits close on a valid submission', async () => {
    vi.mocked(adminService.adjustBalance).mockResolvedValue({ newBalance: 150 })
    vi.mocked(adminService.getPlayers).mockResolvedValue([])

    const wrapper = mount(AdjustBalanceModal, {
      props: { playerId: 'test-id', username: 'testuser' },
    })

    await wrapper.find('input[type="number"]').setValue(50)
    await wrapper.find('input[type="text"]').setValue('refund')
    await wrapper.find('button:last-of-type').trigger('click')
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(adminService.adjustBalance).toHaveBeenCalledWith('test-id', 50, 'refund')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
