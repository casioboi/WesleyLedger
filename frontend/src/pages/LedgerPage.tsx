import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  expenditureLineGroups,
  incomeLineGroups,
} from '../data/ledgerLines'
import { useGriEligibility } from '../gri/useGriEligibility'
import {
  type LedgerRouteState,
  type PendingLedgerItem,
} from '../ledger/reviewFlowTypes'
import { useLedger } from '../ledger/useLedger'
import { formatMinorAsGHS, parseGhsInputToMinor } from '../lib/money'
import { formatQuarterLabel } from '../lib/quarters'
import { remittanceFromGriMinor } from '../lib/remittance'
import styles from './LedgerPage.module.css'

export function LedgerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    year,
    quarter,
    setQuarter,
    totalsInSelectedQuarter,
  } = useLedger()

  const { resolveIncomeGriEligible } = useGriEligibility()

  const [kind, setKind] = useState<'income' | 'expenditure'>('income')
  const [entryDateIso, setEntryDateIso] = useState(() => todayIso())
  const [amountByLine, setAmountByLine] = useState<Record<string, string>>({})
  const [noteByLine, setNoteByLine] = useState<Record<string, string>>({})
  const [categoryQuery, setCategoryQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const groups = useMemo(
    () => (kind === 'income' ? incomeLineGroups() : expenditureLineGroups()),
    [kind]
  )
  const visibleGroups = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase()
    if (query === '') return groups
    return groups
      .map((group) => ({
        ...group,
        lines: group.lines.filter((line) => {
          const haystack = `${group.sectionTitle} ${line.label}`.toLowerCase()
          return haystack.includes(query)
        }),
      }))
      .filter((group) => group.lines.length > 0)
  }, [categoryQuery, groups])

  const rem = useMemo(
    () => remittanceFromGriMinor(totalsInSelectedQuarter.griIncomeMinor),
    [totalsInSelectedQuarter.griIncomeMinor]
  )

  useEffect(() => {
    const state = location.state as LedgerRouteState | null
    if (!state) return

    if ('restoreDraft' in state) {
      setKind(state.restoreDraft.kind)
      setEntryDateIso(state.restoreDraft.entryDateIso)
      setAmountByLine(state.restoreDraft.amountByLine)
      setNoteByLine(state.restoreDraft.noteByLine)
      setFormError(null)
    }

    if ('clearDraft' in state) {
      setAmountByLine({})
      setNoteByLine({})
      setFormError(null)
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  function clearDraft() {
    setAmountByLine({})
    setNoteByLine({})
  }

  function onKindChange(next: 'income' | 'expenditure') {
    setFormError(null)
    setKind(next)
    setCategoryQuery('')
    clearDraft()
  }

  function patchAmount(lineId: string, value: string) {
    setAmountByLine((prev) => ({ ...prev, [lineId]: value }))
  }

  function patchNote(lineId: string, value: string) {
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
            `Invalid amount for "${line.label}". Use GHS like 150 or 150.50 (no symbols).`
          )
          return null
        }
        if (minor === 0) continue
        const note = (noteByLine[line.id] ?? '').trim()
        if (note === '') {
          setFormError(`Add a note for "${line.label}" before review.`)
          return null
        }
        items.push({
          kind,
          lineId: line.id,
          dateIso: entryDateIso,
          amountMinor: minor,
          note,
          lineLabel: line.label,
          sectionTitle: line.sectionTitle,
          countsTowardGri: kind === 'income' ? resolveIncomeGriEligible(line.id) : null,
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

    navigate('/app/ledger/review', {
      state: {
        reviewPayload: {
          draft: {
            kind,
            entryDateIso,
            amountByLine,
            noteByLine,
          },
          pendingItems: batch,
        },
      },
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ledger</h1>
        <p className={styles.lead}>
          Fill in amounts under each schedule category on one form (e.g. all Offertory lines).
          Leave lines blank if they do not apply. Review on the next page, then confirm. Each
          non-zero line becomes its own ledger entry for the date you choose.
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
                onClick={() => setQuarter(year, q)}
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
            >
              Income
            </button>
            <button
              type="button"
              className={`${styles.kindBtn} ${kind === 'expenditure' ? styles.kindBtnOn : ''}`}
              onClick={() => onKindChange('expenditure')}
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
              onChange={(e) => setEntryDateIso(e.target.value)}
              required
            />
          </label>

          <p className={styles.batchHint}>
            Open a category to enter GHS amounts. Notes are required for each amount you enter.
            Only non-empty amounts are saved.
          </p>

          <div className={styles.categorySearchRow}>
            <label className={styles.field}>
              <span className={styles.label}>Find category or line</span>
              <div className={styles.searchInputRow}>
                <input
                  type="search"
                  className={styles.input}
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search categories (e.g. offertory, utility, tithe)"
                  autoComplete="off"
                />
                {categoryQuery.trim() !== '' ? (
                  <button
                    type="button"
                    className={styles.clearInlineBtn}
                    onClick={() => setCategoryQuery('')}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </label>
          </div>

          <div className={styles.batchSections}>
            {visibleGroups.map((g) => {
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
                          placeholder="-"
                          value={amountByLine[line.id] ?? ''}
                          onChange={(e) => patchAmount(line.id, e.target.value)}
                          autoComplete="off"
                          aria-label={`Amount for ${line.label}`}
                        />
                        <input
                          type="text"
                          className={`${styles.input} ${styles.noteInput}`}
                          placeholder="Required if amount entered"
                          value={noteByLine[line.id] ?? ''}
                          onChange={(e) => patchNote(line.id, e.target.value)}
                          autoComplete="off"
                          aria-label={`Note for ${line.label}`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
            {visibleGroups.length === 0 ? (
              <p className={styles.emptyFilterState}>
                No categories match "{categoryQuery.trim()}". Try a different search.
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          ) : null}

          <button type="submit" className={styles.submit}>
            Review entries
          </button>
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
    </div>
  )
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
