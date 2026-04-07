import { forwardRef } from 'react'
import { formatMinorAsGHS } from '../lib/money'
import { formatQuarterLabel, type Quarter } from '../lib/quarters'
import type { QuarterReportData } from './aggregateQuarterReport'
import { groupReportRows } from './aggregateQuarterReport'
import { formatQuarterSubtitle } from './formatReportPeriod'
import styles from './ReportPreview.module.css'

type Props = {
  report: QuarterReportData
  society: string
  circuit: string
  diocese: string
  year: number
  quarter: Quarter
}

function amt(minor: number): string {
  if (minor === 0) return ''
  return formatMinorAsGHS(minor)
}

export const ReportPreview = forwardRef<HTMLDivElement, Props>(function ReportPreview(
  { report, society, circuit, diocese, year, quarter },
  ref
) {
  const incomeGroups = groupReportRows(report.incomeRows)
  const expGroups = groupReportRows(report.expenditureRows)

  return (
    <div ref={ref} className={styles.sheet}>
      <header className={styles.brandBlock}>
        <p className={styles.brandMain}>Methodist Church Ghana</p>
        <p className={styles.brandSub}>{diocese}</p>
        <p className={styles.society}>{society}</p>
        <p className={styles.period}>{formatQuarterSubtitle(year, quarter)}</p>
        <p className={styles.period} style={{ marginTop: 4 }}>
          {formatQuarterLabel(year, quarter)}
        </p>
      </header>

      <div className={styles.columns}>
        <div>
          <div className={styles.colTitle}>Income / Receipt</div>
          {incomeGroups.map((g) => (
            <div key={g.sectionTitle} className={styles.section}>
              <h3 className={styles.sectionTitle}>{g.sectionTitle}</h3>
              {g.items.map((row, idx) => (
                <div key={`${g.sectionTitle}-${idx}-${row.label}`} className={styles.row}>
                  <span className={styles.rowLabel}>{row.label}</span>
                  <span
                    className={`${styles.rowAmt} ${row.minor === 0 ? styles.rowAmtEmpty : ''}`}
                  >
                    {amt(row.minor)}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Total income</span>
              <span className={styles.rowAmt}>{formatMinorAsGHS(report.totalIncomeMinor)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.colTitle}>Expenditure / Payment</div>
          {expGroups.map((g) => (
            <div key={g.sectionTitle} className={styles.section}>
              <h3 className={styles.sectionTitle}>{g.sectionTitle}</h3>
              {g.items.map((row, idx) => (
                <div key={`${g.sectionTitle}-${idx}-${row.label}`} className={styles.row}>
                  <span className={styles.rowLabel}>{row.label}</span>
                  <span
                    className={`${styles.rowAmt} ${row.minor === 0 ? styles.rowAmtEmpty : ''}`}
                  >
                    {amt(row.minor)}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Total expenditure</span>
              <span className={styles.rowAmt}>
                {formatMinorAsGHS(report.totalExpenditureMinor)}
              </span>
            </div>
            <div
              className={`${styles.surplusRow} ${
                report.surplusMinor >= 0 ? styles.surplusPos : styles.surplusNeg
              }`}
            >
              <span>{report.surplusMinor >= 0 ? 'Surplus' : 'Deficit'}</span>
              <span className={styles.rowAmt}>
                {formatMinorAsGHS(Math.abs(report.surplusMinor))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {report.hasComputedRemittanceFill ? (
        <p className={styles.footNote}>
          Connexional, Diocese, Circuit, and Emergency Fund lines show calculated amounts from GRI where no
          manual entry exists on those lines.
        </p>
      ) : null}

      <footer className={styles.signatures}>
        <p className={styles.sigTitle}>Authorised signatures</p>
        <div className={styles.sigGrid}>
          <div className={styles.sigCell}>
            <div className={styles.sigLine} />
            <span className={styles.sigLabel}>Society Steward</span>
          </div>
          <div className={styles.sigCell}>
            <div className={styles.sigLine} />
            <span className={styles.sigLabel}>Society Treasurer</span>
          </div>
          <div className={styles.sigCell}>
            <div className={styles.sigLine} />
            <span className={styles.sigLabel}>Minister-In-Charge</span>
          </div>
        </div>
        <p className={styles.footNote} style={{ marginTop: 8 }}>
          Circuit: {circuit}
        </p>
      </footer>
    </div>
  )
})
