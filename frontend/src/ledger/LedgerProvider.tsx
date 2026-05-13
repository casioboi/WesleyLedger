import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useGriEligibility } from '../gri/useGriEligibility'
import { quarterDateRangeIso, type Quarter } from '../lib/quarters'
import { LedgerContext } from './ledgerContext'
import { saveActiveQuarter, loadActiveQuarter, subscribeActiveQuarter } from './activeQuarterStorage'
import { computeTotalsForRange } from './ledgerTotals'
import type { LedgerTransaction } from './ledgerTypes'
import {
  getLedgerTransactionsSnapshot,
  setLedgerTransactions,
  subscribeLedgerTransactions,
} from './ledgerTransactionsStore'
import {
  getArchivedLedgerTransactionsSnapshot,
  setArchivedLedgerTransactions,
  subscribeArchivedLedgerTransactions,
} from './ledgerArchiveStore'

function newTxId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { resolveIncomeGriEligible } = useGriEligibility()

  const transactions = useSyncExternalStore(
    subscribeLedgerTransactions,
    getLedgerTransactionsSnapshot,
    () => []
  )
  const archivedTransactions = useSyncExternalStore(
    subscribeArchivedLedgerTransactions,
    getArchivedLedgerTransactionsSnapshot,
    () => []
  )

  const [year, setYear] = useState(() => loadActiveQuarter().year)
  const [quarter, setQuarterState] = useState<Quarter>(() => loadActiveQuarter().quarter)

  useEffect(() => {
    saveActiveQuarter(year, quarter)
  }, [year, quarter])

  useEffect(() => {
    return subscribeActiveQuarter(() => {
      const next = loadActiveQuarter()
      setYear(next.year)
      setQuarterState(next.quarter)
    })
  }, [])

  const setQuarter = useCallback((y: number, q: Quarter) => {
    setYear(y)
    setQuarterState(q)
  }, [])

  const addTransaction = useCallback(
    (input: Omit<LedgerTransaction, 'id' | 'createdAt'>) => {
      const tx: LedgerTransaction = {
        ...input,
        amountMinor: Math.round(input.amountMinor),
        id: newTxId(),
        createdAt: new Date().toISOString(),
      }
      const prev = getLedgerTransactionsSnapshot()
      setLedgerTransactions([...prev, tx])
    },
    []
  )

  const removeTransaction = useCallback((id: string) => {
    const prev = getLedgerTransactionsSnapshot()
    setLedgerTransactions(prev.filter((t) => t.id !== id))
  }, [])

  const archiveTransaction = useCallback((id: string) => {
    const prev = getLedgerTransactionsSnapshot()
    const found = prev.find((t) => t.id === id)
    if (!found) return false

    setLedgerTransactions(prev.filter((t) => t.id !== id))
    const archivedPrev = getArchivedLedgerTransactionsSnapshot()
    setArchivedLedgerTransactions([{ ...found, archivedAt: new Date().toISOString() }, ...archivedPrev])
    return true
  }, [])

  const restoreArchivedTransaction = useCallback((id: string) => {
    const archivedPrev = getArchivedLedgerTransactionsSnapshot()
    const found = archivedPrev.find((t) => t.id === id)
    if (!found) return false

    setArchivedLedgerTransactions(archivedPrev.filter((t) => t.id !== id))
    const activePrev = getLedgerTransactionsSnapshot()
    const existingIndex = activePrev.findIndex((t) => t.id === id)
    if (existingIndex >= 0) {
      const next = [...activePrev]
      next[existingIndex] = {
        id: found.id,
        dateIso: found.dateIso,
        kind: found.kind,
        lineId: found.lineId,
        amountMinor: found.amountMinor,
        note: found.note,
        createdAt: found.createdAt,
      }
      setLedgerTransactions(next)
      return true
    }
    setLedgerTransactions([
      ...activePrev,
      {
        id: found.id,
        dateIso: found.dateIso,
        kind: found.kind,
        lineId: found.lineId,
        amountMinor: found.amountMinor,
        note: found.note,
        createdAt: found.createdAt,
      },
    ])
    return true
  }, [])

  const clearArchivedTransactions = useCallback(() => {
    setArchivedLedgerTransactions([])
  }, [])

  const totalsInSelectedQuarter = useMemo(() => {
    const { startIso, endIso } = quarterDateRangeIso(year, quarter)
    return computeTotalsForRange(transactions, startIso, endIso, resolveIncomeGriEligible)
  }, [transactions, year, quarter, resolveIncomeGriEligible])

  const value = useMemo(
    () => ({
      transactions,
      archivedTransactions,
      year,
      quarter,
      setQuarter,
      addTransaction,
      archiveTransaction,
      restoreArchivedTransaction,
      clearArchivedTransactions,
      removeTransaction,
      totalsInSelectedQuarter,
    }),
    [
      transactions,
      archivedTransactions,
      year,
      quarter,
      setQuarter,
      addTransaction,
      archiveTransaction,
      restoreArchivedTransaction,
      clearArchivedTransactions,
      removeTransaction,
      totalsInSelectedQuarter,
    ]
  )

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}
