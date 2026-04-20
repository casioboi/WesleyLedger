import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { type LedgerRouteState } from '../ledger/reviewFlowTypes'
import { useLedger } from '../ledger/useLedger'
import { formatMinorAsGHS } from '../lib/money'
import styles from './LedgerReviewPage.module.css'

export function LedgerReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { addTransaction } = useLedger()

  const routeState = location.state as LedgerRouteState | null
  const payload = routeState && 'reviewPayload' in routeState ? routeState.reviewPayload : null

  const pendingItems = payload?.pendingItems ?? []
  const isIncomeBatch = pendingItems[0]?.kind === 'income'

  const totalMinor = useMemo(
    () => pendingItems.reduce((sum, item) => sum + item.amountMinor, 0),
    [pendingItems]
  )

  if (!payload || pendingItems.length === 0) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>Review entries</h1>
          <p className={styles.lead}>
            No pending entries were found. Return to Ledger and add entries first.
          </p>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/app/ledger', { replace: true })}
          >
            Back to ledger
          </button>
        </section>
      </div>
    )
  }

  const reviewPayload = payload

  function backToEdit() {
    navigate('/app/ledger', {
      replace: true,
      state: { restoreDraft: reviewPayload.draft },
    })
  }

  function confirmSave() {
    for (const row of pendingItems) {
      addTransaction({
        dateIso: row.dateIso,
        kind: row.kind,
        lineId: row.lineId,
        amountMinor: row.amountMinor,
        note: row.note,
      })
    }
    const n = pendingItems.length
    showToast(n === 1 ? '1 entry saved to the ledger.' : `${n} entries saved to the ledger.`)
    navigate('/app/ledger', { replace: true, state: { clearDraft: true } })
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Review entries</h1>
        <p className={styles.lead}>
          {pendingItems.length} ledger {pendingItems.length === 1 ? 'entry' : 'entries'} for{' '}
          {formatDateForReview(reviewPayload.draft.entryDateIso)}. Nothing is stored until you confirm.
        </p>

        <div className={styles.totalRow}>
          <span>
            Total {isIncomeBatch ? 'income received' : 'expenditure spent'}
          </span>
          <strong>{formatMinorAsGHS(totalMinor)} GHS</strong>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Line</th>
                <th scope="col" className={styles.num}>
                  Amount
                </th>
                <th scope="col">Note</th>
                {isIncomeBatch ? <th scope="col">GRI</th> : null}
              </tr>
            </thead>
            <tbody>
              {pendingItems.map((row) => (
                <tr key={`${row.lineId}-${row.amountMinor}-${row.note ?? ''}`}>
                  <td>{row.sectionTitle}</td>
                  <td>{row.lineLabel}</td>
                  <td className={styles.num}>{formatMinorAsGHS(row.amountMinor)} GHS</td>
                  <td>{row.note ?? '-'}</td>
                  {isIncomeBatch ? <td>{row.countsTowardGri ? 'Yes' : 'No'}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.confirmBtn} onClick={confirmSave}>
            Confirm & save to ledger
          </button>
          <button type="button" className={styles.backBtn} onClick={backToEdit}>
            Back to edit
          </button>
        </div>
      </section>
    </div>
  )
}

function formatDateForReview(iso: string): string {
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
