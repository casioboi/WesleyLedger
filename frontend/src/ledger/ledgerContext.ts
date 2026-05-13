import { createContext } from 'react'
import type { Quarter } from '../lib/quarters'
import type { ArchivedLedgerTransaction, LedgerTransaction, QuarterTotals } from './ledgerTypes'

export type LedgerContextValue = {
  transactions: LedgerTransaction[]
  archivedTransactions: ArchivedLedgerTransaction[]
  year: number
  quarter: Quarter
  setQuarter: (year: number, quarter: Quarter) => void
  addTransaction: (input: Omit<LedgerTransaction, 'id' | 'createdAt'>) => void
  archiveTransaction: (id: string) => boolean
  restoreArchivedTransaction: (id: string) => boolean
  clearArchivedTransactions: () => void
  removeTransaction: (id: string) => void
  totalsInSelectedQuarter: QuarterTotals
}

export const LedgerContext = createContext<LedgerContextValue | null>(null)
