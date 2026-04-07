import { EXPENDITURE_LINES, INCOME_LINES } from '../data/ledgerLines'
import { isIsoDateInRange } from '../lib/quarters'
import { remittanceFromGriMinor } from '../lib/remittance'
import type { LedgerTransaction } from '../ledger/ledgerTypes'

export type ReportRow = {
  sectionTitle: string
  label: string
  minor: number
}

export type QuarterReportData = {
  incomeRows: ReportRow[]
  expenditureRows: ReportRow[]
  totalIncomeMinor: number
  totalExpenditureMinor: number
  surplusMinor: number
  griIncomeMinor: number
  /** True when Connexional/Diocese/Circuit/Emergency rows show calculated values (no manual ledger entry). */
  hasComputedRemittanceFill: boolean
}

export function buildQuarterReport(
  transactions: LedgerTransaction[],
  startIso: string,
  endIso: string,
  isIncomeGriEligible: (lineId: string) => boolean
): QuarterReportData {
  const incomeMap = new Map<string, number>()
  const expMap = new Map<string, number>()
  let griIncomeMinor = 0

  for (const t of transactions) {
    if (!isIsoDateInRange(t.dateIso, startIso, endIso)) continue
    if (t.kind === 'income') {
      incomeMap.set(t.lineId, (incomeMap.get(t.lineId) ?? 0) + t.amountMinor)
      if (isIncomeGriEligible(t.lineId)) {
        griIncomeMinor += t.amountMinor
      }
    } else {
      expMap.set(t.lineId, (expMap.get(t.lineId) ?? 0) + t.amountMinor)
    }
  }

  const rem = remittanceFromGriMinor(griIncomeMinor)
  let hasComputedRemittanceFill = false

  function expenditureDisplayMinor(lineId: string): number {
    const logged = expMap.get(lineId) ?? 0
    if (logged > 0) return logged

    let computed = 0
    if (lineId === 'e8-1') computed = rem.connexionalMinor
    else if (lineId === 'e8-2') computed = rem.dioceseMinor
    else if (lineId === 'e8-3') computed = rem.circuitMinor
    else if (lineId === 'e8-5') computed = rem.emergencyMinor
    else return 0

    if (computed > 0) hasComputedRemittanceFill = true
    return computed
  }

  const incomeRows: ReportRow[] = INCOME_LINES.map((l) => ({
    sectionTitle: l.sectionTitle,
    label: l.label,
    minor: incomeMap.get(l.id) ?? 0,
  }))

  const expenditureRows: ReportRow[] = EXPENDITURE_LINES.map((l) => ({
    sectionTitle: l.sectionTitle,
    label: l.label,
    minor: expenditureDisplayMinor(l.id),
  }))

  const totalIncomeMinor = incomeRows.reduce((s, r) => s + r.minor, 0)
  const totalExpenditureMinor = expenditureRows.reduce((s, r) => s + r.minor, 0)

  return {
    incomeRows,
    expenditureRows,
    totalIncomeMinor,
    totalExpenditureMinor,
    surplusMinor: totalIncomeMinor - totalExpenditureMinor,
    griIncomeMinor,
    hasComputedRemittanceFill,
  }
}

export function groupReportRows(rows: ReportRow[]): { sectionTitle: string; items: ReportRow[] }[] {
  const out: { sectionTitle: string; items: ReportRow[] }[] = []
  for (const r of rows) {
    const last = out[out.length - 1]
    if (!last || last.sectionTitle !== r.sectionTitle) {
      out.push({ sectionTitle: r.sectionTitle, items: [{ ...r }] })
    } else {
      last.items.push({ ...r })
    }
  }
  return out
}
