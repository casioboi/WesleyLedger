import type { Quarter } from '../lib/quarters'
import { quarterDateRangeIso } from '../lib/quarters'

export function formatEndingDateLong(year: number, quarter: Quarter): string {
  const { endIso } = quarterDateRangeIso(year, quarter)
  const [y, m, d] = endIso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatQuarterSubtitle(year: number, quarter: Quarter): string {
  const end = formatEndingDateLong(year, quarter)
  return `Receipt and payment account for the quarter ending ${end}`
}
