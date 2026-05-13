import { useMemo, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { getExpenditureLine, getIncomeLine } from '../data/ledgerLines'
import { useGriEligibility } from '../gri/useGriEligibility'
import { useLedger } from '../ledger/useLedger'
import { formatMinorAsGHS } from '../lib/money'
import { formatQuarterLabel, isIsoDateInRange, quarterDateRangeIso } from '../lib/quarters'
import { remittanceFromGriMinor } from '../lib/remittance'
import styles from './LedgerPage.module.css'

export function EntriesPage() {
  const { showToast } = useToast()
  const { transactions, year, quarter, archiveTransaction } = useLedger()
  const { resolveIncomeGriEligible } = useGriEligibility()
  const { startIso, endIso } = quarterDateRangeIso(year, quarter)
  const [dateFromIso, setDateFromIso] = useState('')
  const [dateToIso, setDateToIso] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')

  const quarterRows = useMemo(() => {
    return transactions
      .filter((t) => isIsoDateInRange(t.dateIso, startIso, endIso))
      .sort((a, b) => {
        if (a.dateIso !== b.dateIso) return b.dateIso.localeCompare(a.dateIso)
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [transactions, startIso, endIso])

  const categoryOptions = useMemo(() => {
    const labels = new Set<string>()
    for (const row of quarterRows) labels.add(lineLabelFor(row))
    return Array.from(labels).sort((a, b) => a.localeCompare(b))
  }, [quarterRows])

  const filteredRows = useMemo(() => {
    const minMinor = amountTextToMinor(minAmount)
    const maxMinor = amountTextToMinor(maxAmount)
    const query = categoryQuery.trim().toLowerCase()
    return quarterRows.filter((row) => {
      if (dateFromIso !== '' && row.dateIso < dateFromIso) return false
      if (dateToIso !== '' && row.dateIso > dateToIso) return false
      if (minMinor !== null && row.amountMinor < minMinor) return false
      if (maxMinor !== null && row.amountMinor > maxMinor) return false
      if (query !== '' && !lineLabelFor(row).toLowerCase().includes(query)) return false
      return true
    })
  }, [categoryQuery, dateFromIso, dateToIso, maxAmount, minAmount, quarterRows])

  const quarterGroups = useMemo(() => {
    const byDate = new Map<
      string,
      {
        income: typeof quarterRows
        expenditure: typeof quarterRows
        incomeTotalMinor: number
        expenditureTotalMinor: number
        griIncomeMinor: number
        remittanceConnexionalLoggedMinor: number
        remittanceDioceseLoggedMinor: number
        remittanceCircuitLoggedMinor: number
        remittanceEmergencyLoggedMinor: number
      }
    >()

    for (const row of filteredRows) {
      const curr = byDate.get(row.dateIso) ?? {
        income: [],
        expenditure: [],
        incomeTotalMinor: 0,
        expenditureTotalMinor: 0,
        griIncomeMinor: 0,
        remittanceConnexionalLoggedMinor: 0,
        remittanceDioceseLoggedMinor: 0,
        remittanceCircuitLoggedMinor: 0,
        remittanceEmergencyLoggedMinor: 0,
      }
      if (row.kind === 'income') {
        curr.income.push(row)
        curr.incomeTotalMinor += row.amountMinor
        if (resolveIncomeGriEligible(row.lineId)) curr.griIncomeMinor += row.amountMinor
      } else {
        curr.expenditure.push(row)
        curr.expenditureTotalMinor += row.amountMinor
        if (row.lineId === 'e8-1') curr.remittanceConnexionalLoggedMinor += row.amountMinor
        else if (row.lineId === 'e8-2') curr.remittanceDioceseLoggedMinor += row.amountMinor
        else if (row.lineId === 'e8-3') curr.remittanceCircuitLoggedMinor += row.amountMinor
        else if (row.lineId === 'e8-5') curr.remittanceEmergencyLoggedMinor += row.amountMinor
      }
      byDate.set(row.dateIso, curr)
    }

    return Array.from(byDate.entries()).map(([dateIso, group]) => {
      const rem = remittanceFromGriMinor(group.griIncomeMinor)
      const griPaidMinor =
        (group.remittanceConnexionalLoggedMinor > 0 ? 0 : rem.connexionalMinor) +
        (group.remittanceDioceseLoggedMinor > 0 ? 0 : rem.dioceseMinor) +
        (group.remittanceCircuitLoggedMinor > 0 ? 0 : rem.circuitMinor) +
        (group.remittanceEmergencyLoggedMinor > 0 ? 0 : rem.emergencyMinor)
      return {
        dateIso,
        ...group,
        griPaidMinor,
        expenditureWithGriMinor: group.expenditureTotalMinor + griPaidMinor,
      }
    })
  }, [filteredRows, resolveIncomeGriEligible])

  const isFiltered =
    dateFromIso !== '' ||
    dateToIso !== '' ||
    minAmount.trim() !== '' ||
    maxAmount.trim() !== '' ||
    categoryQuery.trim() !== ''

  function handleArchiveEntry(id: string) {
    const approved = window.confirm(
      'Remove this entry from the active ledger?\n\nIt will be archived and excluded from totals until restored.'
    )
    if (!approved) {
      showToast('Removal cancelled.')
      return
    }
    const moved = archiveTransaction(id)
    if (moved) {
      showToast('Entry removed from active ledger and moved to Archive page.')
      return
    }
    showToast('Entry was not found. Please refresh and try again.')
  }

  function clearFilters() {
    setDateFromIso('')
    setDateToIso('')
    setMinAmount('')
    setMaxAmount('')
    setCategoryQuery('')
  }

  return (
    <section className={styles.tableSection} aria-labelledby="tx-title">
      <h2 id="tx-title" className={styles.sectionTitle}>
        Entries in {formatQuarterLabel(year, quarter)} ({filteredRows.length})
      </h2>
      {quarterRows.length === 0 ? (
        <div className={styles.groupedEntries}>
          <p className={styles.empty}>No transactions in this quarter yet.</p>
        </div>
      ) : (
        <div className={styles.groupedEntries}>
          <section className={styles.entryFilters} aria-label="Search and filter entries">
            <div className={styles.filterGrid}>
              <label className={styles.filterField}>
                <span className={styles.label}>From date</span>
                <input
                  type="date"
                  className={styles.input}
                  value={dateFromIso}
                  onChange={(e) => setDateFromIso(e.target.value)}
                />
              </label>
              <label className={styles.filterField}>
                <span className={styles.label}>To date</span>
                <input
                  type="date"
                  className={styles.input}
                  value={dateToIso}
                  onChange={(e) => setDateToIso(e.target.value)}
                />
              </label>
              <label className={styles.filterField}>
                <span className={styles.label}>Min amount (GHS)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.input}
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className={styles.filterField}>
                <span className={styles.label}>Max amount (GHS)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.input}
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className={styles.filterField}>
                <span className={styles.label}>Entry category</span>
                <input
                  type="search"
                  list="entry-category-options"
                  className={styles.input}
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search by category or line"
                />
              </label>
              <datalist id="entry-category-options">
                {categoryOptions.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
            </div>
            <div className={styles.filterActions}>
              <span className={styles.filterMeta}>
                Showing {filteredRows.length} of {quarterRows.length} entries
              </span>
              {isFiltered ? (
                <button type="button" className={styles.clearInlineBtn} onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </section>

          {filteredRows.length === 0 ? (
            <p className={styles.empty}>No entries match the current filters.</p>
          ) : null}

          {quarterGroups.map((g) => (
            <article key={g.dateIso} className={styles.dateGroup}>
              <header className={styles.dateGroupHeader}>
                <h3 className={styles.dateTitle}>{g.dateIso}</h3>
                <p className={styles.dateSummary}>
                  Income {formatMinorAsGHS(g.incomeTotalMinor)} GHS · Expenditure (incl. GRI){' '}
                  {formatMinorAsGHS(g.expenditureWithGriMinor)} GHS · GRI paid{' '}
                  {formatMinorAsGHS(g.griPaidMinor)} GHS
                </p>
              </header>

              {g.income.length > 0 ? (
                <div className={styles.tableWrap}>
                  <div className={styles.kindHeading}>
                    Income ({g.income.length}) · Total {formatMinorAsGHS(g.incomeTotalMinor)} GHS
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
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
                      {g.income.map((t) => (
                        <tr key={t.id}>
                          <td>{lineLabelFor(t)}</td>
                          <td className={styles.num}>{formatMinorAsGHS(t.amountMinor)}</td>
                          <td className={styles.noteCell}>{t.note ?? '-'}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.danger}
                              onClick={() => handleArchiveEntry(t.id)}
                            >
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {g.expenditure.length > 0 ? (
                <div className={styles.tableWrap}>
                  <div className={styles.kindHeading}>
                    Expenditure ({g.expenditure.length}) · Total {formatMinorAsGHS(g.expenditureTotalMinor)} GHS
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
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
                      {g.expenditure.map((t) => (
                        <tr key={t.id}>
                          <td>{lineLabelFor(t)}</td>
                          <td className={styles.num}>{formatMinorAsGHS(t.amountMinor)}</td>
                          <td className={styles.noteCell}>{t.note ?? '-'}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.danger}
                              onClick={() => handleArchiveEntry(t.id)}
                            >
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          ))}

        </div>
      )}
    </section>
  )
}

function lineLabelFor(t: { kind: 'income' | 'expenditure'; lineId: string }) {
  const line =
    t.kind === 'income' ? getIncomeLine(t.lineId) : getExpenditureLine(t.lineId)
  return line?.label ?? t.lineId
}

function amountTextToMinor(value: string): number | null {
  const text = value.trim()
  if (text === '') return null
  const parsed = Number.parseFloat(text)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}
