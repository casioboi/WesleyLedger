import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChurchProfile } from '../context/useChurchProfile'
import { useToast } from '../context/ToastContext'
import { useGriEligibility } from '../gri/useGriEligibility'
import { useLedger } from '../ledger/useLedger'
import { quarterDateRangeIso } from '../lib/quarters'
import { buildQuarterReport } from '../reports/aggregateQuarterReport'
import { ReportPreview } from '../reports/ReportPreview'
import styles from './ReportsPage.module.css'

export function ReportsPage() {
  const { showToast } = useToast()
  const { profile } = useChurchProfile()
  const { resolveIncomeGriEligible } = useGriEligibility()
  const { transactions, year, quarter } = useLedger()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  const report = useMemo(() => {
    const { startIso, endIso } = quarterDateRangeIso(year, quarter)
    return buildQuarterReport(transactions, startIso, endIso, resolveIncomeGriEligible)
  }, [transactions, year, quarter, resolveIncomeGriEligible])

  async function handlePdf() {
    const el = sheetRef.current
    if (!el) return
    setPdfBusy(true)
    try {
      const { exportReportToPdf } = await import('../reports/exportReportPdf')
      const safeSociety = profile.society.replace(/[^\w\s-]/g, '').slice(0, 40) || 'Society'
      const fname = `WesleyLedger-${safeSociety}-Q${quarter}-${year}.pdf`
      await exportReportToPdf(el, fname)
      showToast('PDF downloaded.')
    } catch {
      showToast('Could not create the PDF. Try again or use Print.', 'error')
    } finally {
      setPdfBusy(false)
    }
  }

  function handlePrint() {
    window.print()
    showToast('Print dialog opened — use your browser’s controls to print or save.', 'info')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Quarterly report</h1>
          <p className={styles.lead}>
            Receipt & Payment summary for the active quarter (
            <Link className={styles.link} to="/app/ledger">
              change on Ledger
            </Link>
            ). Use print or PDF for auditors.
          </p>
        </div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.btnSecondary} onClick={handlePrint}>
            Print
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void handlePdf()}
            disabled={pdfBusy}
          >
            {pdfBusy ? 'Building PDF…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <ReportPreview
        ref={sheetRef}
        report={report}
        society={profile.society}
        circuit={profile.circuit}
        diocese={profile.diocese}
        year={year}
        quarter={quarter}
      />
    </div>
  )
}
