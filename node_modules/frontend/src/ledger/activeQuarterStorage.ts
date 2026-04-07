import type { Quarter } from '../lib/quarters'
import { calendarQuarterFromDate } from '../lib/quarters'

const KEY = 'wesleyLedger.activeQuarter.v1'

const listeners = new Set<() => void>()

export function subscribeActiveQuarter(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function loadActiveQuarter(): { year: number; quarter: Quarter } {
  if (typeof window === 'undefined') {
    return { year: new Date().getFullYear(), quarter: 1 }
  }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return calendarQuarterFromDate(new Date())
    const j = JSON.parse(raw) as { year?: unknown; quarter?: unknown }
    const y = typeof j.year === 'number' ? j.year : new Date().getFullYear()
    const q = j.quarter
    if (q === 1 || q === 2 || q === 3 || q === 4) {
      return { year: y, quarter: q }
    }
  } catch {
    /* ignore */
  }
  return calendarQuarterFromDate(new Date())
}

export function saveActiveQuarter(year: number, quarter: Quarter) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ year, quarter }))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}
