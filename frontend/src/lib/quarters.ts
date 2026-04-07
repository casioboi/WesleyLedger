export type Quarter = 1 | 2 | 3 | 4

export function calendarQuarterFromDate(d: Date): { year: number; quarter: Quarter } {
  const m = d.getMonth()
  const q = (m < 3 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 4) as Quarter
  return { year: d.getFullYear(), quarter: q }
}

/** Inclusive ISO date strings YYYY-MM-DD in local calendar. */
export function quarterDateRangeIso(year: number, quarter: Quarter): {
  startIso: string
  endIso: string
} {
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0)
  const toIso = (x: Date) => {
    const y = x.getFullYear()
    const mo = String(x.getMonth() + 1).padStart(2, '0')
    const da = String(x.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
  }
  return { startIso: toIso(start), endIso: toIso(end) }
}

export function formatQuarterLabel(year: number, quarter: Quarter): string {
  const labels = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'] as const
  return `Q${quarter} ${year} · ${labels[quarter - 1]}`
}

export function isIsoDateInRange(iso: string, startIso: string, endIso: string): boolean {
  return iso >= startIso && iso <= endIso
}
