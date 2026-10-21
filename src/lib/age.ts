/** Age gate (rule U1), mirrored client-side; the server checks again. dob is yyyy-mm-dd. */
export function isAtLeast18(dob: string, today = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = { y: today.getUTCFullYear(), m: today.getUTCMonth() + 1, d: today.getUTCDate() }
  const age = t.y - y - (t.m < mo || (t.m === mo && t.d < d) ? 1 : 0)
  return age >= 18
}

/** Latest birth date that is 18 today, for the date input's max attribute. */
export function latestAdultDob(today = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()))
  return d.toISOString().slice(0, 10)
}
