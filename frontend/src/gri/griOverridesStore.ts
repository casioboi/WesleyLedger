import { INCOME_LINES, isIncomeGriEligibleByDefault } from '../data/ledgerLines'

const STORAGE_KEY = 'wesleyLedger.griEligibility.v1'

let cached: Record<string, boolean> = loadFromStorage()
const listeners = new Set<() => void>()

function loadFromStorage(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'boolean') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    /* quota */
  }
}

function notify() {
  listeners.forEach((l) => l())
}

export function subscribeGriOverrides(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getGriOverridesSnapshot(): Record<string, boolean> {
  return cached
}

function replaceAll(next: Record<string, boolean>) {
  cached = next
  persist()
  notify()
}

/** Keep only income-line keys that differ from schedule defaults (stable for compare + persist). */
export function normalizeGriOverrides(raw: Record<string, boolean>): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const line of INCOME_LINES) {
    if (!Object.prototype.hasOwnProperty.call(raw, line.id)) continue
    const v = raw[line.id]
    if (typeof v !== 'boolean') continue
    const def = isIncomeGriEligibleByDefault(line.id)
    if (v !== def) next[line.id] = v
  }
  return next
}

export function griOverridesMapsEqual(
  a: Record<string, boolean>,
  b: Record<string, boolean>
): boolean {
  return JSON.stringify(normalizeGriOverrides(a)) === JSON.stringify(normalizeGriOverrides(b))
}

/** Replace persisted overrides; normalizes so GRI totals update everywhere that reads the store. */
export function replaceGriOverrides(raw: Record<string, boolean>) {
  replaceAll(normalizeGriOverrides(raw))
}

/** Set eligibility for one income line; clears override when it matches the schedule default. */
export function setLineGriEligible(lineId: string, eligible: boolean) {
  const def = isIncomeGriEligibleByDefault(lineId)
  const next = { ...cached }
  if (eligible === def) {
    delete next[lineId]
  } else {
    next[lineId] = eligible
  }
  replaceAll(next)
}

/** Apply the same GRI choice to every income line in a section (inc-1 … inc-bf). */
export function setSectionGriEligible(sectionId: string, eligible: boolean) {
  const next = { ...cached }
  for (const line of INCOME_LINES) {
    if (line.sectionId !== sectionId) continue
    const def = isIncomeGriEligibleByDefault(line.id)
    if (eligible === def) {
      delete next[line.id]
    } else {
      next[line.id] = eligible
    }
  }
  replaceAll(next)
}

export function resetGriOverridesToDefaults() {
  replaceAll({})
}
