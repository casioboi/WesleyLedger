import { forwardRef } from 'react'
import { formatMinorAsGHS } from '../lib/money'
import { formatQuarterLabel, type Quarter, quarterDateRangeIso, isIsoDateInRange } from '../lib/quarters'
import { formatQuarterSubtitle } from './formatReportPeriod'
import type { LedgerTransaction } from '../ledger/ledgerTypes'
import { getExpenditureLine } from '../data/ledgerLines'
import styles from './DetailedExpenditurePreview.module.css'

type Props = {
  transactions: LedgerTransaction[]
  society: string
  diocese: string
  year: number
  quarter: Quarter
}

const EXCLUDED_GRI_LINES = ['e8-1', 'e8-2', 'e8-3']

export const DetailedExpenditurePreview = forwardRef<HTMLDivElement, Props>(function DetailedExpenditurePreview(
  { transactions, society, diocese, year, quarter },
  ref
) {
  const { startIso, endIso } = quarterDateRangeIso(year, quarter)

  const detailedExpenditures = transactions.filter((t) => {
    if (t.kind !== 'expenditure') return false
    if (!isIsoDateInRange(t.dateIso, startIso, endIso)) return false
    if (EXCLUDED_GRI_LINES.includes(t.lineId)) return false
    return true
  }).sort((a, b) => a.dateIso.localeCompare(b.dateIso))

  const totalMinor = detailedExpenditures.reduce((sum, t) => sum + t.amountMinor, 0)

  return (
    <div ref={ref} className={styles.sheet}>
      <header className={styles.brandBlock}>
        <p className={styles.brandMain}>Methodist Church Ghana</p>
        <p className={styles.brandSub}>{diocese}</p>
        <p className={styles.society}>{society}</p>
        <p className={styles.period}>{formatQuarterSubtitle(year, quarter)}</p>
        <p className={styles.period} style={{ marginTop: 4 }}>
          {formatQuarterLabel(year, quarter)} - Detailed Expenditures
        </p>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Description</th>
              <th className={`${styles.th} ${styles.thRight}`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {detailedExpenditures.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>No expenditures found for this period.</td>
              </tr>
            ) : null}
            {detailedExpenditures.map((t) => (
              <tr key={t.id} className={styles.tr}>
                <td className={styles.td}>{t.dateIso}</td>
                <td className={styles.td}>{getExpenditureLine(t.lineId)?.label || t.lineId}</td>
                <td className={styles.td}>{t.note?.trim() || '-'}</td>
                <td className={`${styles.td} ${styles.tdRight}`}>{formatMinorAsGHS(t.amountMinor)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalTr}>
              <td colSpan={3} className={`${styles.td} ${styles.tdTotalLabel}`}>Total Expenditure (Excl. GRI)</td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdTotalVal}`}>{formatMinorAsGHS(totalMinor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
})
