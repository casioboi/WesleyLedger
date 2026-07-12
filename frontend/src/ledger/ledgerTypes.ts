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

export type ArchivedLedgerTransaction = LedgerTransaction & {
  archivedAt: string
}

export type QuarterTotals = {
  incomeMinor: number
  expenditureMinor: number
  griIncomeMinor: number
  surplusMinor: number
}

export type LedgerLineDef = {
  id: string
  sectionId: string
  sectionTitle: string
  label: string
  /** When true, amounts on this line feed GRI-based remittances unless overridden later in Settings. */
  defaultGriEligible?: boolean
}
