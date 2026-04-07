import { createContext } from 'react'
import type { Quarter } from '../lib/quarters'
import type { LedgerTransaction, QuarterTotals } from './ledgerTypes'

export type LedgerContextValue = {
  transactions: LedgerTransaction[]
  year: number
  quarter: Quarter
  setQuarter: (year: number, quarter: Quarter) => void
  addTransaction: (input: Omit<LedgerTransaction, 'id' | 'createdAt'>) => void
  removeTransaction: (id: string) => void
  totalsInSelectedQuarter: QuarterTotals
}

export const LedgerContext = createContext<LedgerContextValue | null>(null)
