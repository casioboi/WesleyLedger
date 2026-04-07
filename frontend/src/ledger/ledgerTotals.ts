import { isIsoDateInRange } from '../lib/quarters'
import type { LedgerTransaction, QuarterTotals } from './ledgerTypes'

export function computeTotalsForRange(
  transactions: LedgerTransaction[],
  startIso: string,
  endIso: string,
  isIncomeGriEligible: (lineId: string) => boolean
): QuarterTotals {
  let incomeMinor = 0
  let expenditureMinor = 0
  let griIncomeMinor = 0

  for (const t of transactions) {
    if (!isIsoDateInRange(t.dateIso, startIso, endIso)) continue
    if (t.kind === 'income') {
      incomeMinor += t.amountMinor
      if (isIncomeGriEligible(t.lineId)) {
        griIncomeMinor += t.amountMinor
      }
    } else {
      expenditureMinor += t.amountMinor
    }
  }

  return {
    incomeMinor,
    expenditureMinor,
    griIncomeMinor,
    surplusMinor: incomeMinor - expenditureMinor,
  }
}
