import { forwardRef } from 'react'
import type { WeeklyGriAssessment } from '../lib/weeklyGriAssessment'
import { formatMinorAsGHS } from '../lib/money'
import styles from './WeeklyGriAssessmentPreview.module.css'

type Props = {
  assessment: WeeklyGriAssessment
  society: string
  circuit: string
  diocese: string
  weekLabel: string
  weekNumber: number
}

export const WeeklyGriAssessmentPreview = forwardRef<HTMLDivElement, Props>(
  function WeeklyGriAssessmentPreview(
    { assessment, society, circuit, diocese, weekLabel, weekNumber },
    ref
  ) {
    const { totals, lines } = assessment
    return (
      <div ref={ref} className={styles.sheet}>
        <header className={styles.brandBlock}>
          <div className={styles.church}>
            <p className={styles.brandMain}>The Methodist Church Ghana</p>
            <p className={styles.brandSub}>{diocese}</p>
            <p className={styles.brandSub}>{circuit}</p>
            <p className={styles.society}>{society}</p>
          </div>
          <div className={styles.period}>
            <strong>WEEKLY GRI ASSESSMENT</strong>
            <span>ISO Week {weekNumber}</span>
            <span>{weekLabel}</span>
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Income source</th>
                <th>GRI income<br />100%</th>
                <th>Connexional<br />40%</th>
                <th>Diocese<br />9%</th>
                <th>Circuit<br />13%</th>
                <th>Emergency<br />2% of 38%</th>
                <th>Total assessment</th>
                <th>Society balance</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    No GRI-eligible income was recorded for this week.
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.lineId}>
                    <td>{line.label}</td>
                    <td>{formatMinorAsGHS(line.incomeMinor)}</td>
                    <td>{formatMinorAsGHS(line.connexionalMinor)}</td>
                    <td>{formatMinorAsGHS(line.dioceseMinor)}</td>
                    <td>{formatMinorAsGHS(line.circuitMinor)}</td>
                    <td>{formatMinorAsGHS(line.emergencyMinor)}</td>
                    <td>{formatMinorAsGHS(line.totalAssessmentMinor)}</td>
                    <td>{formatMinorAsGHS(line.societyBalanceMinor)}</td>
                  </tr>
                ))
              )}
              <tr className={styles.totalRow}>
                <th scope="row">WEEKLY TOTAL</th>
                <td>{formatMinorAsGHS(totals.incomeMinor)}</td>
                <td>{formatMinorAsGHS(totals.connexionalMinor)}</td>
                <td>{formatMinorAsGHS(totals.dioceseMinor)}</td>
                <td>{formatMinorAsGHS(totals.circuitMinor)}</td>
                <td>{formatMinorAsGHS(totals.emergencyMinor)}</td>
                <td>{formatMinorAsGHS(totals.totalAssessmentMinor)}</td>
                <td>{formatMinorAsGHS(totals.societyBalanceMinor)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.note}>
          Emergency Fund is calculated as 2% of the remaining 38% of GRI. Total assessment
          adds the Connexional, Diocese, Circuit, and Emergency amounts. Society balance is
          the remaining GRI after those amounts. Pesewa rounding is distributed across
          income lines so the weekly totals match the existing assessment calculation.
        </p>
        <footer className={styles.signatures}>
          <span>Prepared by: __________________________</span>
          <span>Approved by: __________________________</span>
          <span>Date: __________________</span>
        </footer>
      </div>
    )
  }
)
