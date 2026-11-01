import { getMergedIncomeLines } from '../data/ledgerLines'
import type { LedgerTransaction } from '../ledger/ledgerTypes'
import { remittanceFromGriMinor } from './remittance'

export type GriAssessmentAmounts = {
  incomeMinor: number
  connexionalMinor: number
  dioceseMinor: number
  circuitMinor: number
  emergencyMinor: number
  totalAssessmentMinor: number
  societyBalanceMinor: number
}

export type WeeklyGriAssessmentLine = GriAssessmentAmounts & {
  lineId: string
  label: string
}

export type WeeklyGriAssessment = {
  lines: WeeklyGriAssessmentLine[]
  totals: GriAssessmentAmounts
}

export function calculateGriAssessmentAmounts(incomeMinor: number): GriAssessmentAmounts {
  return calculateGriAssessmentLines([{ incomeMinor }])[0]
}

export function calculateGriAssessmentLines<T extends { incomeMinor: number }>(
  lines: T[]
): (T & GriAssessmentAmounts)[] {
  const safeLines = lines.map((line) => ({
    ...line,
    incomeMinor: Math.max(0, Math.round(line.incomeMinor)),
  }))
  const totalIncomeMinor = safeLines.reduce((sum, line) => sum + line.incomeMinor, 0)
  const totalRemittance = remittanceFromGriMinor(totalIncomeMinor)
  const allocations = {
    connexionalMinor: allocateRoundedShare(safeLines, 0.4, totalRemittance.connexionalMinor),
    dioceseMinor: allocateRoundedShare(safeLines, 0.09, totalRemittance.dioceseMinor),
    circuitMinor: allocateRoundedShare(safeLines, 0.13, totalRemittance.circuitMinor),
    emergencyMinor: allocateRoundedShare(
      safeLines,
      0.38 * 0.02,
      totalRemittance.emergencyMinor
    ),
  }

  return safeLines.map((line, index) => {
    const connexionalMinor = allocations.connexionalMinor[index]
    const dioceseMinor = allocations.dioceseMinor[index]
    const circuitMinor = allocations.circuitMinor[index]
    const emergencyMinor = allocations.emergencyMinor[index]
    const totalAssessmentMinor =
      connexionalMinor + dioceseMinor + circuitMinor + emergencyMinor
    return {
      ...line,
      connexionalMinor,
      dioceseMinor,
      circuitMinor,
      emergencyMinor,
      totalAssessmentMinor,
      societyBalanceMinor: line.incomeMinor - totalAssessmentMinor,
    }
  })
}

export function calendarWeekRange(anchorIso: string): { startIso: string; endIso: string } {
  const [year, month, day] = anchorIso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)

  const startIso = toLocalIso(date)
  date.setDate(date.getDate() + 6)
  return { startIso, endIso: toLocalIso(date) }
}

export function shiftCalendarWeek(anchorIso: string, weeks: number): string {
  const { startIso } = calendarWeekRange(anchorIso)
  const [year, month, day] = startIso.split('-').map(Number)
  const date = new Date(year, month - 1, day + weeks * 7)
  return toLocalIso(date)
}

export function formatCalendarWeek(anchorIso: string): string {
  const { startIso, endIso } = calendarWeekRange(anchorIso)
  const [startYear, startMonth, startDay] = startIso.split('-').map(Number)
  const [endYear, endMonth, endDay] = endIso.split('-').map(Number)
  const start = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)
  const dateFormat = new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
  })
  const yearFormat = new Intl.DateTimeFormat('en-GH', { year: 'numeric' })
  return `${dateFormat.format(start)}–${dateFormat.format(end)}, ${yearFormat.format(end)}`
}

export function isoWeekNumber(anchorIso: string): number {
  const [year, month, day] = calendarWeekRange(anchorIso).startIso.split('-').map(Number)
  const thursday = new Date(Date.UTC(year, month - 1, day))
  thursday.setUTCDate(thursday.getUTCDate() + 3)
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7)
  )
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604_800_000)
}

export function buildWeeklyGriAssessment(
  transactions: LedgerTransaction[],
  startIso: string,
  endIso: string,
  isIncomeGriEligible: (lineId: string) => boolean,
  additionalIncomeByLine: ReadonlyMap<string, number> = new Map()
): WeeklyGriAssessment {
  const incomeByLine = new Map<string, number>()

  for (const transaction of transactions) {
    if (
      transaction.kind !== 'income' ||
      transaction.dateIso < startIso ||
      transaction.dateIso > endIso ||
      !isIncomeGriEligible(transaction.lineId)
    ) {
      continue
    }

    incomeByLine.set(
      transaction.lineId,
      (incomeByLine.get(transaction.lineId) ?? 0) + transaction.amountMinor
    )
  }

  for (const [lineId, amountMinor] of additionalIncomeByLine) {
    if (!isIncomeGriEligible(lineId)) continue
    incomeByLine.set(lineId, (incomeByLine.get(lineId) ?? 0) + amountMinor)
  }

  const incomeLines = getMergedIncomeLines()
    .filter((line) => isIncomeGriEligible(line.id))
    .flatMap((line) => {
      const incomeMinor = incomeByLine.get(line.id) ?? 0
      if (incomeMinor <= 0) return []
      return [{ lineId: line.id, label: line.label, incomeMinor }]
    })
  const lines = calculateGriAssessmentLines(incomeLines)

  const totals = lines.reduce<GriAssessmentAmounts>(
    (sum, line) => ({
      incomeMinor: sum.incomeMinor + line.incomeMinor,
      connexionalMinor: sum.connexionalMinor + line.connexionalMinor,
      dioceseMinor: sum.dioceseMinor + line.dioceseMinor,
      circuitMinor: sum.circuitMinor + line.circuitMinor,
      emergencyMinor: sum.emergencyMinor + line.emergencyMinor,
      totalAssessmentMinor: sum.totalAssessmentMinor + line.totalAssessmentMinor,
      societyBalanceMinor: sum.societyBalanceMinor + line.societyBalanceMinor,
    }),
    {
      incomeMinor: 0,
      connexionalMinor: 0,
      dioceseMinor: 0,
      circuitMinor: 0,
      emergencyMinor: 0,
      totalAssessmentMinor: 0,
      societyBalanceMinor: 0,
    }
  )

  return { lines, totals }
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function allocateRoundedShare<T extends { incomeMinor: number }>(
  lines: T[],
  rate: number,
  targetMinor: number
): number[] {
  const allocations = lines.map((line) => Math.floor(line.incomeMinor * rate))
  const remaining = targetMinor - allocations.reduce((sum, amount) => sum + amount, 0)
  const remainderOrder = lines
    .map((line, index) => ({
      index,
      remainder: line.incomeMinor * rate - allocations[index],
    }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)

  for (let index = 0; index < remaining; index += 1) {
    const allocation = remainderOrder[index]
    if (allocation) allocations[allocation.index] += 1
  }
  return allocations
}
