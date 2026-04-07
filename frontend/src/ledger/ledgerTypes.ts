export type LedgerTransaction = {
  id: string
  /** Calendar date YYYY-MM-DD (local intent). */
  dateIso: string
  kind: 'income' | 'expenditure'
  lineId: string
  amountMinor: number
  note?: string
  createdAt: string
}

export type QuarterTotals = {
  incomeMinor: number
  expenditureMinor: number
  griIncomeMinor: number
  surplusMinor: number
}
