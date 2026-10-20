/**
 * Provably-fair round checker, run entirely in the browser with Web Crypto.
 *
 * Before betting opens the server publishes SHA-256(serverSeed). After the round it reveals
 * the seed, and anyone can recompute the crash point:
 *
 *   h     = HMAC-SHA256(key = serverSeed, message = roundId)      (hex)
 *   r     = first 13 hex digits of h / 2^52                       (uniform in [0, 1))
 *   crash = 1.00                                  if r < edge
 *   crash = floor(100 * (1 - edge) / (1 - r)) / 100  otherwise
 *   crash = min(crash, maxMultiplier)
 *
 * Formula v2 (the capped game) ends the round as "max multiplier reached" when crash >= cap;
 * v1 rounds never do. This mirrors the backend's CrashPointCalculator exactly (same IEEE
 * doubles), and is checked against its 1 000 test vectors in verifyRound.spec.ts.
 *
 * The verdict never trusts the crash point the server reports: we compute our own and
 * compare it to theirs.
 */

const encoder = new TextEncoder()

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle
  if (!s) throw new Error('Web Crypto is not available in this browser.')
  return s
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Lower-case hex SHA-256 of a UTF-8 string. */
export async function sha256Hex(text: string): Promise<string> {
  return toHex(await subtle().digest('SHA-256', encoder.encode(text)))
}

/** Lower-case hex HMAC-SHA256(key, message), both UTF-8. */
export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const k = await subtle().importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await subtle().sign('HMAC', k, encoder.encode(message)))
}

/** The crash point from an HMAC hex digest. Pure maths, no crypto. */
export function crashPointFromHmac(hmacHex: string, houseEdge: number, maxMultiplier: number): number {
  const r = parseInt(hmacHex.slice(0, 13), 16) / Math.pow(2, 52)
  if (r < houseEdge) return 1
  const raw = (1 - houseEdge) / (1 - r)
  const crash = Math.floor(raw * 100) / 100
  // Round away float noise (1.0800000000000001 → 1.08) before the cap, like the server's decimal cast.
  return Math.min(Math.round(crash * 100) / 100, maxMultiplier)
}

export function isMaxReached(crash: number, maxMultiplier: number, formulaVersion: number): boolean {
  return formulaVersion >= 2 && crash >= maxMultiplier
}

export interface RoundProof {
  roundId: string
  serverSeed: string
  serverSeedHash: string
  houseEdge: number
  maxMultiplier: number
  formulaVersion: number
  /** What the server says happened; only compared against, never trusted. */
  crashMultiplier: number | null
  maxMultiplierReached: boolean
  /** The HMAC message the server says it used (must be the round id). */
  hmacMessage?: string
}

export interface VerifyResult {
  computedHash: string
  hashMatches: boolean
  computedCrash: number
  crashMatches: boolean
  computedMaxReached: boolean
  maxReachedMatches: boolean
  messageMatches: boolean
  /** Every check passed. */
  match: boolean
}

export async function verifyRound(proof: RoundProof): Promise<VerifyResult> {
  const computedHash = await sha256Hex(proof.serverSeed)
  // Always the round id we asked about, not whatever message the server claims.
  const hmac = await hmacSha256Hex(proof.serverSeed, proof.roundId)
  const computedCrash = crashPointFromHmac(hmac, proof.houseEdge, proof.maxMultiplier)
  const computedMaxReached = isMaxReached(computedCrash, proof.maxMultiplier, proof.formulaVersion)

  const hashMatches = computedHash === proof.serverSeedHash.trim().toLowerCase()
  const crashMatches = proof.crashMultiplier !== null && Math.abs(computedCrash - proof.crashMultiplier) < 0.005
  const maxReachedMatches = computedMaxReached === proof.maxMultiplierReached
  const messageMatches = proof.hmacMessage === undefined || proof.hmacMessage.toLowerCase() === proof.roundId.toLowerCase()

  return {
    computedHash,
    hashMatches,
    computedCrash,
    crashMatches,
    computedMaxReached,
    maxReachedMatches,
    messageMatches,
    match: hashMatches && crashMatches && maxReachedMatches && messageMatches,
  }
}
