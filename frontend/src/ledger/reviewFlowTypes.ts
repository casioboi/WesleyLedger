export type PendingLedgerItem = {
  kind: 'income' | 'expenditure'
  lineId: string
  dateIso: string
  amountMinor: number
  note?: string
  lineLabel: string
  sectionTitle: string
  countsTowardGri: boolean | null
}

export type LedgerDraft = {
  kind: 'income' | 'expenditure'
  entryDateIso: string
  amountByLine: Record<string, string>
  noteByLine: Record<string, string>
}

export type LedgerReviewPayload = {
  draft: LedgerDraft
  pendingItems: PendingLedgerItem[]
}

export type LedgerRouteState =
  | { reviewPayload: LedgerReviewPayload }
  | { restoreDraft: LedgerDraft }
  | { clearDraft: true }
