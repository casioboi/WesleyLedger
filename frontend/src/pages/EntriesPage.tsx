import { useMemo } from 'react'
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
  const { transactions, year, quarter, removeTransaction } = useLedger()
  const { resolveIncomeGriEligible } = useGriEligibility()
  const { startIso, endIso } = quarterDateRangeIso(year, quarter)

  const quarterRows = useMemo(() => {
    return transactions
      .filter((t) => isIsoDateInRange(t.dateIso, startIso, endIso))
      .sort((a, b) => {
        if (a.dateIso !== b.dateIso) return b.dateIso.localeCompare(a.dateIso)
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [transactions, startIso, endIso])

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

    for (const row of quarterRows) {
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
  }, [quarterRows, resolveIncomeGriEligible])

  return (
    <section className={styles.tableSection} aria-labelledby="tx-title">
      <h2 id="tx-title" className={styles.sectionTitle}>
        Entries in {formatQuarterLabel(year, quarter)} ({quarterRows.length})
      </h2>
      {quarterRows.length === 0 ? (
        <p className={styles.empty}>No transactions in this quarter yet.</p>
      ) : (
        <div className={styles.groupedEntries}>
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
