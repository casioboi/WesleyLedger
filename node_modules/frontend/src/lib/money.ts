/** Ghana Cedis stored as integer pesewas (1 GHS = 100) to avoid float drift. */
export const PESEWAS_PER_GHS = 100

export function parseGhsInputToMinor(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '')
  if (s === '') return null
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n < 0) return null
  if (n > 999_999_999.99) return null
  return Math.round(n * PESEWAS_PER_GHS)
}

export function formatMinorAsGHS(minor: number): string {
  const safe = Math.round(minor)
  const neg = safe < 0
  const v = Math.abs(safe)
  const gh = Math.floor(v / PESEWAS_PER_GHS)
  const ps = v % PESEWAS_PER_GHS
  const frac = ps.toString().padStart(2, '0')
  const parts = gh.toLocaleString('en-GH', { maximumFractionDigits: 0 })
  return `${neg ? '−' : ''}${parts}.${frac}`
}
