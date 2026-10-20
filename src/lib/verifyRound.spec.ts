// @vitest-environment node
import { describe, expect, it } from 'vitest'
import vectors from './__fixtures__/crash-vectors.json'
import { crashPointFromHmac, hmacSha256Hex, sha256Hex, verifyRound } from './verifyRound'

interface Vector {
  serverSeed: string
  serverSeedHash: string
  roundId: string
  houseEdge: number
  maxMultiplier: number
  formulaVersion: number
  crashMultiplier: number
  maxMultiplierReached: boolean
}

const all = vectors as Vector[]

describe('verifyRound (backend crash-vectors.json)', () => {
  it('has the full fixture', () => {
    expect(all).toHaveLength(1000)
  })

  it('matches every vector: hash, crash point and max-reached', async () => {
    const failures: string[] = []
    for (const v of all) {
      const result = await verifyRound({ ...v, hmacMessage: v.roundId })
      if (!result.hashMatches) failures.push(`${v.roundId} hash ${result.computedHash}`)
      if (result.computedCrash !== v.crashMultiplier) failures.push(`${v.roundId} crash ${result.computedCrash} != ${v.crashMultiplier}`)
      if (result.computedMaxReached !== v.maxMultiplierReached) failures.push(`${v.roundId} maxReached`)
      if (!result.match) failures.push(`${v.roundId} verdict`)
    }
    expect(failures).toEqual([])
  })

  it('flags a crash point the seed does not produce', async () => {
    const v = all[0]!
    const result = await verifyRound({ ...v, crashMultiplier: v.crashMultiplier + 0.5 })
    expect(result.hashMatches).toBe(true)
    expect(result.crashMatches).toBe(false)
    expect(result.match).toBe(false)
  })

  it('flags a seed that does not match the published hash', async () => {
    const v = all[0]!
    const result = await verifyRound({ ...v, serverSeedHash: await sha256Hex('something else') })
    expect(result.hashMatches).toBe(false)
    expect(result.match).toBe(false)
  })

  it('never uses a different HMAC message than the round id', async () => {
    const v = all[0]!
    const result = await verifyRound({ ...v, hmacMessage: 'not-the-round' })
    expect(result.messageMatches).toBe(false)
    expect(result.match).toBe(false)
  })

  it('crashes instantly when r is below the edge', async () => {
    expect(crashPointFromHmac('0000000000000' + 'f'.repeat(51), 0.01, 100)).toBe(1)
    expect(crashPointFromHmac('fffffffffffff' + '0'.repeat(51), 0.01, 100)).toBe(100)
    expect((await hmacSha256Hex('k', 'm')).length).toBe(64)
  })
})
