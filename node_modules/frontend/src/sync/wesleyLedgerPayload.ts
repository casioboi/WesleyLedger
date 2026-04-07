import { applyChurchProfileFromSync, getChurchProfileStorageSnapshot } from '../context/ChurchProfileProvider'
import { getGriOverridesSnapshot, replaceGriOverrides } from '../gri/griOverridesStore'
import { loadActiveQuarter, saveActiveQuarter } from '../ledger/activeQuarterStorage'
import type { LedgerTransaction } from '../ledger/ledgerTypes'
import { getLedgerTransactionsSnapshot, setLedgerTransactions } from '../ledger/ledgerTransactionsStore'
import type { ChurchProfile } from '../lib/churchProfileModel'
import type { Quarter } from '../lib/quarters'

export type WesleyLedgerPayloadV1 = {
  version: 1
  transactions: LedgerTransaction[]
  churchProfile: ChurchProfile
  griOverrides: Record<string, boolean>
  activeQuarter: { year: number; quarter: Quarter }
}

function emptyProfile(): ChurchProfile {
  return { society: '', circuit: '', diocese: '', updatedAt: '' }
}

function isQuarter(q: unknown): q is Quarter {
  return q === 1 || q === 2 || q === 3 || q === 4
}

function parseTransaction(row: unknown): LedgerTransaction | null {
  if (!row || typeof row !== 'object') return null
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
    return {
      id: r.id,
      dateIso: r.dateIso,
      kind: r.kind,
      lineId: r.lineId,
      amountMinor: Math.round(r.amountMinor),
      note: typeof r.note === 'string' ? r.note : undefined,
      createdAt: r.createdAt,
    }
  }
  return null
}

export function parseWesleyLedgerPayloadV1(raw: unknown): WesleyLedgerPayloadV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.version !== 1) return null
  if (!Array.isArray(o.transactions)) return null
  const transactions: LedgerTransaction[] = []
  for (const row of o.transactions) {
    const t = parseTransaction(row)
    if (t) transactions.push(t)
  }
  let churchProfile: ChurchProfile = emptyProfile()
  if (o.churchProfile && typeof o.churchProfile === 'object') {
    const p = o.churchProfile as Record<string, unknown>
    if (
      typeof p.society === 'string' &&
      typeof p.circuit === 'string' &&
      typeof p.diocese === 'string'
    ) {
      churchProfile = {
        society: p.society,
        circuit: p.circuit,
        diocese: p.diocese,
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '',
      }
    }
  }
  const griOverrides: Record<string, boolean> = {}
  if (o.griOverrides && typeof o.griOverrides === 'object' && !Array.isArray(o.griOverrides)) {
    for (const [k, v] of Object.entries(o.griOverrides)) {
      if (typeof v === 'boolean') griOverrides[k] = v
    }
  }
  let year = new Date().getFullYear()
  let quarter: Quarter = 1
  if (o.activeQuarter && typeof o.activeQuarter === 'object' && !Array.isArray(o.activeQuarter)) {
    const aq = o.activeQuarter as Record<string, unknown>
    if (typeof aq.year === 'number' && Number.isFinite(aq.year)) year = Math.round(aq.year)
    if (isQuarter(aq.quarter)) quarter = aq.quarter
  }
  return {
    version: 1,
    transactions,
    churchProfile,
    griOverrides,
    activeQuarter: { year, quarter },
  }
}

export function collectLocalPayload(): WesleyLedgerPayloadV1 {
  const profile = getChurchProfileStorageSnapshot()
  const aq = loadActiveQuarter()
  return {
    version: 1,
    transactions: getLedgerTransactionsSnapshot(),
    churchProfile: profile ?? emptyProfile(),
    griOverrides: { ...getGriOverridesSnapshot() },
    activeQuarter: { year: aq.year, quarter: aq.quarter },
  }
}

export function applyPayloadToLocalStores(payload: WesleyLedgerPayloadV1) {
  applyChurchProfileFromSync(payload.churchProfile)
  replaceGriOverrides(payload.griOverrides)
  setLedgerTransactions(payload.transactions)
  saveActiveQuarter(payload.activeQuarter.year, payload.activeQuarter.quarter)
}