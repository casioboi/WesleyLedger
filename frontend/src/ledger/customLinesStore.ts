import type { LedgerLineDef } from './ledgerTypes'

const STORAGE_KEY = 'wesleyLedger.customLines.v1'

export type CustomLinesPayload = {
  addedIncomeLines: LedgerLineDef[]
  addedExpenditureLines: LedgerLineDef[]
  renamedLines: Record<string, string>
}

function defaultPayload(): CustomLinesPayload {
  return {
    addedIncomeLines: [],
    addedExpenditureLines: [],
    renamedLines: {},
  }
}

let cached: CustomLinesPayload = loadFromStorage()
const listeners = new Set<() => void>()

function loadFromStorage(): CustomLinesPayload {
  if (typeof window === 'undefined') return defaultPayload()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPayload()
    const parsed = JSON.parse(raw) as Partial<CustomLinesPayload>
    return {
      addedIncomeLines: Array.isArray(parsed.addedIncomeLines) ? parsed.addedIncomeLines : [],
      addedExpenditureLines: Array.isArray(parsed.addedExpenditureLines) ? parsed.addedExpenditureLines : [],
      renamedLines: (parsed.renamedLines && typeof parsed.renamedLines === 'object' && !Array.isArray(parsed.renamedLines))
        ? (parsed.renamedLines as Record<string, string>)
        : {},
    }
  } catch {
    return defaultPayload()
  }
}

export function subscribeCustomLines(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getCustomLinesSnapshot(): CustomLinesPayload {
  return cached
}

export function setCustomLines(next: CustomLinesPayload) {
  cached = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l())
}

export function updateCustomLines(updater: (prev: CustomLinesPayload) => CustomLinesPayload) {
  setCustomLines(updater(cached))
}
