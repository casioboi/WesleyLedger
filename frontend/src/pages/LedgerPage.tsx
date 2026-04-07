import { useMemo, useState, type FormEvent } from 'react'
import { useToast } from '../context/ToastContext'
import {
  expenditureLineGroups,
  getExpenditureLine,
  getIncomeLine,
  incomeLineGroups,
} from '../data/ledgerLines'
import { isIsoDateInRange, quarterDateRangeIso, formatQuarterLabel } from '../lib/quarters'
import { formatMinorAsGHS, parseGhsInputToMinor } from '../lib/money'
import { remittanceFromGriMinor } from '../lib/remittance'
import { useGriEligibility } from '../gri/useGriEligibility'
import { useLedger } from '../ledger/useLedger'
import styles from './LedgerPage.module.css'

type PendingLedgerItem = {
  kind: 'income' | 'expenditure'
  lineId: string
  dateIso: string
  amountMinor: number
  note?: string
  lineLabel: string
  sectionTitle: string
  countsTowardGri: boolean | null
}

export function LedgerPage() {
  const { showToast } = useToast()
  const {
    transactions,
    year,
    quarter,
    setQuarter,
    addTransaction,
    removeTransaction,
    totalsInSelectedQuarter,
  } = useLedger()

  const { resolveIncomeGriEligible } = useGriEligibility()

  const [kind, setKind] = useState<'income' | 'expenditure'>('income')
  const [entryDateIso, setEntryDateIso] = useState(() => todayIso())
  const [amountByLine, setAmountByLine] = useState<Record<string, string>>({})
  const [noteByLine, setNoteByLine] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingLedgerItem[] | null>(null)

  const formLocked = pendingItems !== null

  const { startIso, endIso } = quarterDateRangeIso(year, quarter)

  const groups = useMemo(
    () => (kind === 'income' ? incomeLineGroups() : expenditureLineGroups()),
    [kind]
  )

  const quarterRows = useMemo(() => {
    return transactions
      .filter((t) => isIsoDateInRange(t.dateIso, startIso, endIso))
      .sort((a, b) => {
        if (a.dateIso !== b.dateIso) return b.dateIso.localeCompare(a.dateIso)
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [transactions, startIso, endIso])

  const rem = useMemo(
    () => remittanceFromGriMinor(totalsInSelectedQuarter.griIncomeMinor),
    [totalsInSelectedQuarter.griIncomeMinor]
  )

  function clearDraft() {
    setAmountByLine({})
    setNoteByLine({})
  }

  function onKindChange(next: 'income' | 'expenditure') {
    setPendingItems(null)
    setFormError(null)
    setKind(next)
    clearDraft()
  }

  function patchAmount(lineId: string, value: string) {
    setPendingItems(null)
    setAmountByLine((prev) => ({ ...prev, [lineId]: value }))
  }

  function patchNote(lineId: string, value: string) {
    setPendingItems(null)
    setNoteByLine((prev) => ({ ...prev, [lineId]: value }))
  }

  function buildPendingBatch(): PendingLedgerItem[] | null {
    const items: PendingLedgerItem[] = []
    for (const g of groups) {
      for (const line of g.lines) {
        const raw = (amountByLine[line.id] ?? '').trim()
        if (raw === '') continue
        const minor = parseGhsInputToMinor(raw)
        if (minor === null) {
          setFormError(
            `Invalid amount for “${line.label}”. Use GHS like 150 or 150.50 (no symbols).`
          )
          return null
        }
        if (minor === 0) continue
        const note = (noteByLine[line.id] ?? '').trim()
        items.push({
          kind,
          lineId: line.id,
          dateIso: entryDateIso,
          amountMinor: minor,
          note: note || undefined,
          lineLabel: line.label,
          sectionTitle: line.sectionTitle,
          countsTowardGri:
            kind === 'income' ? resolveIncomeGriEligible(line.id) : null,
        })
      }
    }
    if (items.length === 0) {
      setFormError('Enter at least one amount under any category, then review.')
      return null
    }
    return items
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const batch = buildPendingBatch()
    if (!batch) return
    setPendingItems(batch)
  }

  function cancelPendingBatch() {
    setPendingItems(null)
  }

  function confirmSaveBatch() {
    if (!pendingItems?.length) return
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
    setPendingItems(null)
    clearDraft()
    showToast(
      n === 1 ? '1 entry saved to the ledger.' : `${n} entries saved to the ledger.`
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ledger</h1>
        <p className={styles.lead}>
          Fill in amounts under each schedule category on one form (e.g. all Offertory lines).
          Leave lines blank if they do not apply. Review once, then confirm — each non-zero line
          becomes its own ledger entry for the date you choose.
        </p>
      </header>

      <section className={styles.quarterBar} aria-label="Reporting quarter">
        <span className={styles.quarterLabel}>Quarter</span>
        <div className={styles.quarterControls}>
          <label className={styles.yearField}>
            <span className={styles.srOnly}>Year</span>
            <input
              type="number"
              min={2020}
              max={2040}
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10)
                if (Number.isFinite(y)) {
                  setPendingItems(null)
                  setQuarter(y, quarter)
                }
              }}
            />
          </label>
          <div className={styles.qButtons} role="group" aria-label="Quarter">
            {([1, 2, 3, 4] as const).map((q) => (
              <button
                key={q}
                type="button"
                className={`${styles.qBtn} ${quarter === q ? styles.qBtnActive : ''}`}
                onClick={() => {
                  setPendingItems(null)
                  setQuarter(year, q)
                }}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>
        <span className={styles.quarterHint}>{formatQuarterLabel(year, quarter)}</span>
      </section>

      <div className={styles.grid}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <h2 className={styles.sectionTitle}>New entries</h2>

          <div className={styles.kindRow} role="group" aria-label="Entry type">
            <button
              type="button"
              className={`${styles.kindBtn} ${kind === 'income' ? styles.kindBtnOn : ''}`}
              onClick={() => onKindChange('income')}
              disabled={formLocked}
            >
              Income
            </button>
            <button
              type="button"
              className={`${styles.kindBtn} ${kind === 'expenditure' ? styles.kindBtnOn : ''}`}
              onClick={() => onKindChange('expenditure')}
              disabled={formLocked}
            >
              Expenditure
            </button>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Entry date (applies to every line you fill)</span>
            <input
              type="date"
              className={styles.input}
              value={entryDateIso}
              onChange={(e) => {
                setPendingItems(null)
                setEntryDateIso(e.target.value)
              }}
              required
              disabled={formLocked}
            />
          </label>

          <p className={styles.batchHint}>
            Open a category to enter GHS amounts. Optional notes are stored per line. Only non-empty
            amounts are saved.
          </p>

          <div className={styles.batchSections}>
            {groups.map((g) => {
              const sid = g.lines[0]?.sectionId ?? g.sectionTitle
              return (
                <details key={sid} className={styles.batchBlock} open>
                  <summary className={styles.batchSummary}>{g.sectionTitle}</summary>
                  <div className={styles.batchBody}>
                    <div className={styles.batchGridHead} aria-hidden>
                      <span className={styles.batchHeadLine}>Line</span>
                      <span className={styles.batchHeadAmt}>Amount (GHS)</span>
                      <span className={styles.batchHeadNote}>Note</span>
                    </div>
                    {g.lines.map((line) => (
                      <div key={line.id} className={styles.batchRow}>
                        <div className={styles.batchLineCell}>
                          <span className={styles.batchLineText}>{line.label}</span>
                          {kind === 'income' && resolveIncomeGriEligible(line.id) ? (
                            <span className={styles.griPill}>GRI</span>
                          ) : null}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`${styles.input} ${styles.amountInput}`}
                          placeholder="—"
                          value={amountByLine[line.id] ?? ''}
                          onChange={(e) => patchAmount(line.id, e.target.value)}
                          autoComplete="off"
                          disabled={formLocked}
                          aria-label={`Amount for ${line.label}`}
                        />
                        <input
                          type="text"
                          className={`${styles.input} ${styles.noteInput}`}
                          placeholder="Optional"
                          value={noteByLine[line.id] ?? ''}
                          onChange={(e) => patchNote(line.id, e.target.value)}
                          autoComplete="off"
                          disabled={formLocked}
                          aria-label={`Note for ${line.label}`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>

          {formError ? (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          ) : null}

          {pendingItems ? (
            <section
              className={styles.reviewPanel}
              aria-labelledby="ledger-review-heading"
            >
              <h3 id="ledger-review-heading" className={styles.reviewTitle}>
                Confirm before saving
              </h3>
              <p className={styles.reviewLead}>
                {pendingItems.length} ledger {pendingItems.length === 1 ? 'entry' : 'entries'} will
                be added for {formatDateForReview(entryDateIso)}. Nothing is stored until you
                confirm.
              </p>
              <div className={styles.reviewTableWrap}>
                <table className={styles.reviewTable}>
                  <thead>
                    <tr>
                      <th scope="col">Section</th>
                      <th scope="col">Line</th>
                      <th scope="col" className={styles.reviewNum}>
                        Amount
                      </th>
                      <th scope="col">Note</th>
                      {pendingItems[0]?.kind === 'income' ? <th scope="col">GRI</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((row) => (
                      <tr key={row.lineId}>
                        <td>{row.sectionTitle}</td>
                        <td>{row.lineLabel}</td>
                        <td className={styles.reviewNum}>
                          {formatMinorAsGHS(row.amountMinor)} GHS
                        </td>
                        <td>{row.note ?? '—'}</td>
                        {pendingItems[0]?.kind === 'income' ? (
                          <td>
                            {row.countsTowardGri ? 'Yes' : 'No'}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.reviewActions}>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={confirmSaveBatch}
                >
                  Confirm & save to ledger
                </button>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={cancelPendingBatch}
                >
                  Back to edit
                </button>
              </div>
            </section>
          ) : (
            <button type="submit" className={styles.submit}>
              Review entries
            </button>
          )}
        </form>

        <aside className={styles.summary} aria-labelledby="sum-title">
          <h2 id="sum-title" className={styles.sectionTitle}>
            This quarter
          </h2>
          <dl className={styles.dl}>
            <div className={styles.dlRow}>
              <dt>Total income</dt>
              <dd>{formatMinorAsGHS(totalsInSelectedQuarter.incomeMinor)} GHS</dd>
            </div>
            <div className={styles.dlRow}>
              <dt>Total expenditure</dt>
              <dd>{formatMinorAsGHS(totalsInSelectedQuarter.expenditureMinor)} GHS</dd>
            </div>
            <div className={styles.dlRow}>
              <dt>Surplus / (deficit)</dt>
              <dd
                className={
                  totalsInSelectedQuarter.surplusMinor >= 0 ? styles.pos : styles.neg
                }
              >
                {formatMinorAsGHS(totalsInSelectedQuarter.surplusMinor)} GHS
              </dd>
            </div>
            <div className={styles.dlRow}>
              <dt>GRI (subject to remittance)</dt>
              <dd>{formatMinorAsGHS(totalsInSelectedQuarter.griIncomeMinor)} GHS</dd>
            </div>
          </dl>

          <h3 className={styles.subhead}>Remittance preview (from GRI)</h3>
          <ul className={styles.remList}>
            <li>
              <span>40% Connexional</span>
              <span>{formatMinorAsGHS(rem.connexionalMinor)} GHS</span>
            </li>
            <li>
              <span>9% Diocese</span>
              <span>{formatMinorAsGHS(rem.dioceseMinor)} GHS</span>
            </li>
            <li>
              <span>13% Circuit</span>
              <span>{formatMinorAsGHS(rem.circuitMinor)} GHS</span>
            </li>
            <li>
              <span>Emergency (2% of 38%)</span>
              <span>{formatMinorAsGHS(rem.emergencyMinor)} GHS</span>
            </li>
          </ul>
        </aside>
      </div>

      <section className={styles.tableSection} aria-labelledby="tx-title">
        <h2 id="tx-title" className={styles.sectionTitle}>
          Entries in {formatQuarterLabel(year, quarter)} ({quarterRows.length})
        </h2>
        {quarterRows.length === 0 ? (
          <p className={styles.empty}>No transactions in this quarter yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Line</th>
                  <th scope="col" className={styles.num}>
                    Amount
                  </th>
                  <th scope="col">Note</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {quarterRows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.dateIso}</td>
                    <td>{t.kind === 'income' ? 'Income' : 'Expenditure'}</td>
                    <td>{lineLabelFor(t)}</td>
                    <td className={styles.num}>{formatMinorAsGHS(t.amountMinor)}</td>
                    <td className={styles.noteCell}>{t.note ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.danger}
                        onClick={() => {
                          removeTransaction(t.id)
                          showToast('Entry removed from the ledger.')
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function lineLabelFor(t: { kind: 'income' | 'expenditure'; lineId: string }) {
  const line =
    t.kind === 'income' ? getIncomeLine(t.lineId) : getExpenditureLine(t.lineId)
  return line?.label ?? t.lineId
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
