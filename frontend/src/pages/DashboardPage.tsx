import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatQuarterLabel } from '../lib/quarters'
import { formatMinorAsGHS } from '../lib/money'
import { remittanceFromGriMinor } from '../lib/remittance'
import { useLedger } from '../ledger/useLedger'
import styles from './DashboardPage.module.css'

const actions = [
  {
    title: 'Record transaction',
    desc: 'Add income or expenditure to the ledger',
    to: '/app/ledger',
    icon: IconPlus,
  },
  {
    title: 'Quarterly report',
    desc: 'Preview or export Receipt & Payment PDF',
    to: '/app/reports',
    icon: IconDoc,
  },
  {
    title: 'Church profile',
    desc: 'Society, circuit & diocese on reports',
    to: '/app/settings',
    icon: IconBuilding,
  },
]

export function DashboardPage() {
  const { year, quarter, setQuarter, totalsInSelectedQuarter } = useLedger()

  const rem = useMemo(
    () => remittanceFromGriMinor(totalsInSelectedQuarter.griIncomeMinor),
    [totalsInSelectedQuarter.griIncomeMinor]
  )

  const viewLabel = `${formatQuarterLabel(year, quarter).replace(' ', '.').replace(' · ', ' ')}`

  const prevQuarter = () => {
    const nextQuarter = quarter === 1 ? 4 : (quarter - 1) as const
    const nextYear = quarter === 1 ? year - 1 : year
    setQuarter(nextYear, nextQuarter)
  }

  const nextQuarter = () => {
    const nextQuarterValue = quarter === 4 ? 1 : (quarter + 1) as const
    const nextYear = quarter === 4 ? year + 1 : year
    setQuarter(nextYear, nextQuarterValue)
  }

  const stats = [
    {
      label: 'Income (period)',
      value: formatMinorAsGHS(totalsInSelectedQuarter.incomeMinor),
      hint: 'GHS',
      accent: 'blue' as const,
    },
    {
      label: 'Expenditure',
      value: formatMinorAsGHS(totalsInSelectedQuarter.expenditureMinor),
      hint: 'GHS',
      accent: 'neutral' as const,
    },
    {
      label: 'Surplus / Deficit',
      value: formatMinorAsGHS(totalsInSelectedQuarter.surplusMinor),
      hint: 'GHS',
      accent:
        totalsInSelectedQuarter.surplusMinor >= 0 ? ('blue' as const) : ('red' as const),
    },
  ]

  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.heroHeader}>
          <div>
            <p className={styles.greet}>Good day, Treasurer</p>
            <h1 className={styles.headline}>Overview</h1>
          </div>
          <div className={styles.quarterSwitcher}>
            <button type="button" onClick={prevQuarter} className={styles.quarterButton}>
              Previous
            </button>
            <span className={styles.quarterLabel}>{viewLabel}</span>
            <button type="button" onClick={nextQuarter} className={styles.quarterButton}>
              Next
            </button>
          </div>
        </div>
        <p className={styles.lead}>
          Viewing records for <strong>{formatQuarterLabel(year, quarter)}</strong>. Data stays on this device until you export and sync.
        </p>
      </motion.section>

      <section className={styles.stats} aria-label="Period summary">
        {stats.map((s, i) => (
          <motion.article
            key={s.label}
            className={`${styles.statCard} ${styles[`stat_${s.accent}`]}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
          >
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>
              {s.value} <span className={styles.statHint}>{s.hint}</span>
            </span>
          </motion.article>
        ))}
      </section>

      <section className={styles.actions} aria-label="Quick actions">
        <h2 className={styles.sectionTitle}>Quick actions</h2>
        <ul className={styles.actionList}>
          {actions.map((a, i) => (
            <motion.li
              key={a.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
            >
              <Link className={styles.actionCard} to={a.to}>
                <span className={styles.actionIcon}>
                  <a.icon />
                </span>
                <span className={styles.actionText}>
                  <span className={styles.actionTitle}>{a.title}</span>
                  <span className={styles.actionDesc}>{a.desc}</span>
                </span>
                <span className={styles.chev} aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className={styles.remittance} aria-labelledby="rem-title">
        <h2 id="rem-title" className={styles.sectionTitle}>
          Remittance preview
        </h2>
        <p className={styles.remittanceNote}>
          Based on <strong>GRI</strong> (income lines marked subject to remittance) for {formatQuarterLabel(year, quarter)}.
        </p>
        <div className={styles.remittanceGrid}>
          <div className={styles.remittanceRow}>
            <span>Connexional (40%)</span>
            <span className={styles.remittanceVal}>
              {formatMinorAsGHS(rem.connexionalMinor)} <span className={styles.statHint}>GHS</span>
            </span>
          </div>
          <div className={styles.remittanceRow}>
            <span>Diocese (9%)</span>
            <span className={styles.remittanceVal}>
              {formatMinorAsGHS(rem.dioceseMinor)} <span className={styles.statHint}>GHS</span>
            </span>
          </div>
          <div className={styles.remittanceRow}>
            <span>Circuit (13%)</span>
            <span className={styles.remittanceVal}>
              {formatMinorAsGHS(rem.circuitMinor)} <span className={styles.statHint}>GHS</span>
            </span>
          </div>
          <div className={styles.remittanceRow}>
            <span>Emergency (2% of 38%)</span>
            <span className={styles.remittanceVal}>
              {formatMinorAsGHS(rem.emergencyMinor)} <span className={styles.statHint}>GHS</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h2v4M13 21v-4h2v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
