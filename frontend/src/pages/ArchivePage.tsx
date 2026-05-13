import { useMemo, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { getExpenditureLine, getIncomeLine } from '../data/ledgerLines'
import { useLedger } from '../ledger/useLedger'
import { formatMinorAsGHS } from '../lib/money'
import styles from './LedgerPage.module.css'

export function ArchivePage() {
  const { showToast } = useToast()
  const { archivedTransactions, restoreArchivedTransaction, clearArchivedTransactions } = useLedger()
  const [kindFilter, setKindFilter] = useState<'all' | 'income' | 'expenditure'>('all')
  const [query, setQuery] = useState('')

  const archivedRows = useMemo(() => {
    return [...archivedTransactions].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
  }, [archivedTransactions])

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return archivedRows.filter((row) => {
      if (kindFilter !== 'all' && row.kind !== kindFilter) return false
      if (needle === '') return true
      const label = lineLabelFor(row).toLowerCase()
      const note = (row.note ?? '').toLowerCase()
      return (
        label.includes(needle) ||
        note.includes(needle) ||
        row.dateIso.includes(needle) ||
        row.archivedAt.toLowerCase().includes(needle)
      )
    })
  }, [archivedRows, kindFilter, query])

  function clearFilters() {
    setKindFilter('all')
    setQuery('')
  }

  function handleRestoreArchivedEntry(id: string) {
    const approved = window.confirm(
      'Restore this archived entry?\n\nIt will return to the active ledger and affect totals again.'
    )
    if (!approved) {
      showToast('Restore cancelled.')
      return
    }
    const restored = restoreArchivedTransaction(id)
    if (restored) {
      showToast('Archived entry restored to active ledger.')
      return
    }
    showToast('Archived entry was not found.')
  }

  function handleClearArchive() {
    if (archivedRows.length === 0) return
    const approved = window.confirm(
      'Permanently delete all archived entries from this device?\n\nThis action cannot be undone.'
    )
    if (!approved) {
      showToast('Archive clear cancelled.')
      return
    }
    clearArchivedTransactions()
    showToast('Archived entries permanently deleted.')
  }

  const isFiltered = kindFilter !== 'all' || query.trim() !== ''

  return (
    <section className={styles.tableSection} aria-labelledby="archive-title">
      <h2 id="archive-title" className={styles.sectionTitle}>
        Archived entries ({filteredRows.length})
      </h2>

      <section className={styles.entryFilters} aria-label="Filter archived entries">
        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span className={styles.label}>Type</span>
            <select
              className={styles.select}
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as 'all' | 'income' | 'expenditure')}
            >
              <option value="all">All entries</option>
              <option value="income">Income only</option>
              <option value="expenditure">Expenditure only</option>
            </select>
          </label>
          <label className={styles.filterField}>
            <span className={styles.label}>Search archive</span>
            <input
              type="search"
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by line, note, or date"
              autoComplete="off"
            />
          </label>
        </div>
        <div className={styles.filterActions}>
          <span className={styles.filterMeta}>
            Showing {filteredRows.length} of {archivedRows.length} archived entries
          </span>
          {isFiltered ? (
            <button type="button" className={styles.clearInlineBtn} onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.archiveSection} aria-labelledby="archive-actions-title">
        <div className={styles.archiveHead}>
          <h3 id="archive-actions-title" className={styles.sectionTitle}>
            Archive actions
          </h3>
          <button
            type="button"
            className={styles.danger}
            onClick={handleClearArchive}
            disabled={archivedRows.length === 0}
          >
            Clear archive permanently
          </button>
        </div>
        <p className={styles.archiveNote}>
          Archived entries are excluded from reports, final amounts, and outstanding balances.
          Restoring an entry returns it to active totals.
        </p>

        {archivedRows.length === 0 ? (
          <p className={styles.empty}>No archived entries yet.</p>
        ) : filteredRows.length === 0 ? (
          <p className={styles.empty}>No archived entries match the current filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Archived on</th>
                  <th scope="col">Type</th>
                  <th scope="col">Entry date</th>
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
                {filteredRows.map((row) => (
                  <tr key={`${row.id}-${row.archivedAt}`}>
                    <td>{formatDateForArchive(row.archivedAt)}</td>
                    <td>{row.kind === 'income' ? 'Income' : 'Expenditure'}</td>
                    <td>{row.dateIso}</td>
                    <td>{lineLabelFor(row)}</td>
                    <td className={styles.num}>{formatMinorAsGHS(row.amountMinor)}</td>
                    <td className={styles.noteCell}>{row.note ?? '-'}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => handleRestoreArchivedEntry(row.id)}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

function lineLabelFor(t: { kind: 'income' | 'expenditure'; lineId: string }) {
  const line =
    t.kind === 'income' ? getIncomeLine(t.lineId) : getExpenditureLine(t.lineId)
  return line?.label ?? t.lineId
}

function formatDateForArchive(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
