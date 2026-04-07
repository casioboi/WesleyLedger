import type { LedgerTransaction } from './ledgerTypes'

const STORAGE_KEY = 'wesleyLedger.transactions.v1'

let cached: LedgerTransaction[] = loadFromStorage()
const listeners = new Set<() => void>()

function loadFromStorage(): LedgerTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: LedgerTransaction[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      if (
        typeof r.id === 'string' &&
        typeof r.dateIso === 'string' &&
        (r.kind === 'income' || r.kind === 'expenditure') &&
        typeof r.lineId === 'string' &&
        typeof r.amountMinor === 'number' &&
        Number.isFinite(r.amountMinor) &&
        r.amountMinor >= 0 &&
        typeof r.createdAt === 'string'
      ) {
        out.push({
          id: r.id,
          dateIso: r.dateIso,
          kind: r.kind,
          lineId: r.lineId,
          amountMinor: Math.round(r.amountMinor),
          note: typeof r.note === 'string' ? r.note : undefined,
          createdAt: r.createdAt,
        })
      }
    }
    return out
  } catch {
    return []
  }
}

export function subscribeLedgerTransactions(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getLedgerTransactionsSnapshot(): LedgerTransaction[] {
  return cached
}

export function setLedgerTransactions(next: LedgerTransaction[]) {
  cached = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l())
}
