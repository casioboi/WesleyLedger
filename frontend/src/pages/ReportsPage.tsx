import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useChurchProfile } from '../context/useChurchProfile'
import { useToast } from '../context/ToastContext'
import { useGriEligibility } from '../gri/useGriEligibility'
import { useLedger } from '../ledger/useLedger'
import { quarterDateRangeIso } from '../lib/quarters'
import { buildQuarterReport } from '../reports/aggregateQuarterReport'
import { ReportPreview } from '../reports/ReportPreview'
import { DetailedExpenditurePreview } from '../reports/DetailedExpenditurePreview'
import { DetailedIncomePreview } from '../reports/DetailedIncomePreview'
import { WeeklyGriAssessmentPreview } from '../reports/WeeklyGriAssessmentPreview'
import {
  buildWeeklyGriAssessment,
  calendarWeekRange,
  formatCalendarWeek,
  isoWeekNumber,
  shiftCalendarWeek,
} from '../lib/weeklyGriAssessment'
import styles from './ReportsPage.module.css'

export function ReportsPage() {
  const { showToast } = useToast()
  const { profile } = useChurchProfile()
  const { resolveIncomeGriEligible } = useGriEligibility()
  const { transactions, year, quarter } = useLedger()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [reportType, setReportType] = useState<
    'summary' | 'detailed-expenditure' | 'detailed-income' | 'weekly-gri'
  >('summary')
  const [weekAnchorIso, setWeekAnchorIso] = useState(() => todayIso())

  const report = useMemo(() => {
    const { startIso, endIso } = quarterDateRangeIso(year, quarter)
    return buildQuarterReport(transactions, startIso, endIso, resolveIncomeGriEligible)
  }, [transactions, year, quarter, resolveIncomeGriEligible])

  const weeklyAssessment = useMemo(() => {
    const { startIso, endIso } = calendarWeekRange(weekAnchorIso)
    return buildWeeklyGriAssessment(
      transactions,
      startIso,
      endIso,
      resolveIncomeGriEligible
    )
  }, [transactions, weekAnchorIso, resolveIncomeGriEligible])

  async function handlePdf(silent = false) {
    const el = sheetRef.current
    if (!el) return
    setPdfBusy(true)
    try {
      const { exportReportToPdf } = await import('../reports/exportReportPdf')
      const safeSociety = profile.society.replace(/[^\w\s-]/g, '').slice(0, 40) || 'Society'
      const { startIso } = calendarWeekRange(weekAnchorIso)
      const suffix =
        reportType === 'detailed-expenditure'
          ? '-Expenditure'
          : reportType === 'detailed-income'
            ? '-Income'
            : reportType === 'weekly-gri'
              ? `-Week-${startIso}-GRI-Assessment`
              : ''
      const period = reportType === 'weekly-gri' ? '' : `-Q${quarter}-${year}`
      const fname = `WesleyLedger-${safeSociety}${period}${suffix}.pdf`
      await exportReportToPdf(el, fname, reportType === 'weekly-gri' ? 'landscape' : 'portrait')
      if (!silent) {
        showToast(
          Capacitor.isNativePlatform()
            ? `Saved to Documents/WesleyLedger/Reports/${fname}.`
            : 'PDF downloaded.',
          'success',
          'Report ready'
        )
      }
    } catch (err) {
      console.error('PDF export error:', err)
      showToast('Could not export the report. Please try again.', 'error')
    } finally {
      setPdfBusy(false)
    }
  }

  async function handlePrint() {
    if (Capacitor.isNativePlatform()) {
      // On Android, create and share the same PDF file used by the download action.
      await handlePdf(true)
      return
    }
    if (reportType === 'weekly-gri') {
      const printStyle = document.createElement('style')
      printStyle.textContent = '@page { size: A4 landscape; margin: 8mm; }'
      document.head.appendChild(printStyle)
      window.addEventListener('afterprint', () => printStyle.remove(), { once: true })
      window.setTimeout(() => printStyle.remove(), 60_000)
    }
    window.print()
    showToast('Print dialog opened - use your browser controls to print or save.', 'info')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {reportType === 'weekly-gri' ? 'Weekly GRI assessment' : 'Quarterly report'}
          </h1>
          <p className={styles.lead}>
            {reportType === 'weekly-gri' ? (
              'Review each GRI income line and its calculated breakdown for a calendar week. Print or download the sheet in A4 landscape.'
            ) : (
              <>
                Receipt & Payment summary for the active quarter (
                <Link className={styles.link} to="/app/ledger">
                  change on Ledger
                </Link>
                ). Use print or PDF for auditors.
              </>
            )}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={reportType === 'summary' ? styles.btnPrimary : styles.btnSecondary}
              onClick={() => setReportType('summary')}
            >
              Summary Report
            </button>
            <button
              type="button"
              className={reportType === 'detailed-expenditure' ? styles.btnPrimary : styles.btnSecondary}
              onClick={() => setReportType('detailed-expenditure')}
            >
              Detailed Expenditures (Excl. GRI)
            </button>
            <button
              type="button"
              className={reportType === 'detailed-income' ? styles.btnPrimary : styles.btnSecondary}
              onClick={() => setReportType('detailed-income')}
            >
              Detailed Income
            </button>
            <button
              type="button"
              className={reportType === 'weekly-gri' ? styles.btnPrimary : styles.btnSecondary}
              onClick={() => setReportType('weekly-gri')}
            >
              Weekly GRI Assessment
            </button>
          </div>
          {reportType === 'weekly-gri' ? (
            <div className={styles.weekPicker} aria-label="Choose assessment week">
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setWeekAnchorIso((date) => shiftCalendarWeek(date, -1))}
                aria-label="Previous calendar week"
              >
                Previous week
              </button>
              <label className={styles.weekDate}>
                <span>Choose a date in the week</span>
                <input
                  type="date"
                  value={weekAnchorIso}
                  onChange={(event) => {
                    if (event.target.value) setWeekAnchorIso(event.target.value)
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setWeekAnchorIso((date) => shiftCalendarWeek(date, 1))}
                aria-label="Next calendar week"
              >
                Next week
              </button>
              <span className={styles.weekLabel}>
                ISO Week {isoWeekNumber(weekAnchorIso)} · {formatCalendarWeek(weekAnchorIso)}
              </span>
            </div>
          ) : null}
        </div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.btnSecondary} onClick={() => void handlePrint()}>
            Print
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void handlePdf()}
            disabled={pdfBusy}
          >
            {pdfBusy ? 'Building PDF...' : 'Download PDF'}
          </button>
        </div>
      </header>

      <div className={styles.previewContainer}>
        {reportType === 'summary' ? (
          <ReportPreview
            ref={sheetRef}
            report={report}
            society={profile.society}
            diocese={profile.diocese}
            year={year}
            quarter={quarter}
          />
        ) : reportType === 'detailed-expenditure' ? (
          <DetailedExpenditurePreview
            ref={sheetRef}
            transactions={transactions}
            society={profile.society}
            diocese={profile.diocese}
            year={year}
            quarter={quarter}
          />
        ) : reportType === 'detailed-income' ? (
          <DetailedIncomePreview
            ref={sheetRef}
            transactions={transactions}
            society={profile.society}
            diocese={profile.diocese}
            year={year}
            quarter={quarter}
          />
        ) : (
          <WeeklyGriAssessmentPreview
            ref={sheetRef}
            assessment={weeklyAssessment}
            society={profile.society}
            circuit={profile.circuit}
            diocese={profile.diocese}
            weekLabel={formatCalendarWeek(weekAnchorIso)}
            weekNumber={isoWeekNumber(weekAnchorIso)}
          />
        )}
      </div>
    </div>
  )
}

function todayIso(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
