import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaymentStore } from './paymentStore'
import { usePlayerStore } from './playerStore'
import * as paymentService from '@/services/paymentService'
import * as playerService from '@/services/playerService'
import * as walletService from '@/services/walletService'

vi.mock('@/services/paymentService')
vi.mock('@/services/playerService')
vi.mock('@/services/walletService')

function profileWithBalance(creditBalance: number) {
  return {
    playerId: 'p1',
    username: 'test',
    email: 't@test.local',
    creditBalance,
    memberSinceUtc: '2026-01-01T00:00:00Z',
    isAdmin: false,
    displayedAchievementKey: null,
  }
}

describe('paymentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(walletService.getTransactions).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('reports an error instead of throwing when packs fail to load', async () => {
    vi.mocked(paymentService.getPacks).mockRejectedValue(new Error('network down'))
    const store = usePaymentStore()

    await expect(store.fetchPacks()).resolves.toBeUndefined()

    expect(store.packs).toEqual([])
    expect(store.packsError).not.toBe('')
    expect(store.isLoadingPacks).toBe(false)
  })

  it('submits a hidden form with every signed field to PayFast', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    vi.mocked(paymentService.createCheckout).mockResolvedValue({
      actionUrl: 'https://sandbox.payfast.co.za/eng/process',
      fields: { merchant_id: '10000100', amount: '35.00', signature: 'abc123' },
    })
    usePlayerStore().profile = profileWithBalance(500)
    const store = usePaymentStore()

    await store.redirectToCheckout('starter')

    const form = document.querySelector('form')!
    expect(form.action).toBe('https://sandbox.payfast.co.za/eng/process')
    expect(form.method.toLowerCase()).toBe('post')
    const values = Object.fromEntries(
      Array.from(form.querySelectorAll('input')).map((input) => [input.name, input.value]),
    )
    expect(values).toEqual({ merchant_id: '10000100', amount: '35.00', signature: 'abc123' })
    expect(submit).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('skycrash.preCheckoutBalance')).toBe('500')
  })

  it('shows the server message and re-enables buying when checkout fails', async () => {
    vi.mocked(paymentService.createCheckout).mockRejectedValue({
      response: { data: { message: 'Online purchases are unavailable right now.' } },
    })
    const store = usePaymentStore()

    await expect(store.redirectToCheckout('starter')).resolves.toBeUndefined()

    expect(store.errorMessage).toBe('Online purchases are unavailable right now.')
    expect(store.isRedirecting).toBe(false)
    expect(document.querySelector('form')).toBeNull()
  })

  it('detects credits that landed before the player was redirected back', async () => {
    // Balance was 500 before checkout; the ITN already credited it to 2,500.
    sessionStorage.setItem('skycrash.preCheckoutBalance', '500')
    vi.mocked(playerService.getMyProfile).mockResolvedValue(profileWithBalance(2500))
    const store = usePaymentStore()

    await expect(store.refreshBalanceAfterPurchase()).resolves.toBe(true)

    expect(playerService.getMyProfile).toHaveBeenCalledTimes(1)
    expect(walletService.getTransactions).toHaveBeenCalled()
  })

  it('waits for a late ITN and reports when credits arrive', async () => {
    vi.useFakeTimers()
    sessionStorage.setItem('skycrash.preCheckoutBalance', '500')
    vi.mocked(playerService.getMyProfile)
      .mockResolvedValueOnce(profileWithBalance(500))
      .mockResolvedValueOnce(profileWithBalance(500))
      .mockResolvedValue(profileWithBalance(2500))
    const store = usePaymentStore()

    const result = store.refreshBalanceAfterPurchase()
    await vi.runAllTimersAsync()

    await expect(result).resolves.toBe(true)
    expect(playerService.getMyProfile).toHaveBeenCalledTimes(3)
  })

  it('reports not-yet-credited when the balance never changes', async () => {
    vi.useFakeTimers()
    sessionStorage.setItem('skycrash.preCheckoutBalance', '500')
    vi.mocked(playerService.getMyProfile).mockResolvedValue(profileWithBalance(500))
    const store = usePaymentStore()

    const result = store.refreshBalanceAfterPurchase()
    await vi.runAllTimersAsync()

    await expect(result).resolves.toBe(false)
  })
})
