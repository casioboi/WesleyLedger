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

  const totalsInSelectedQuarter = useMemo(() => {
    const { startIso, endIso } = quarterDateRangeIso(year, quarter)
    return computeTotalsForRange(transactions, startIso, endIso, resolveIncomeGriEligible)
  }, [transactions, year, quarter, resolveIncomeGriEligible])

  const value = useMemo(
    () => ({
      transactions,
      year,
      quarter,
      setQuarter,
      addTransaction,
      removeTransaction,
      totalsInSelectedQuarter,
    }),
    [
      transactions,
      year,
      quarter,
      setQuarter,
      addTransaction,
      removeTransaction,
      totalsInSelectedQuarter,
    ]
  )

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}
