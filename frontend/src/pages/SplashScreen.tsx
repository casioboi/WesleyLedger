import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DualRingLoader } from '../components/DualRingLoader'
import { ThemeToggle } from '../components/ThemeToggle'
import styles from './SplashScreen.module.css'

const LOAD_MS = 2000

export function SplashScreen() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const done = window.setTimeout(
      () => setShowLoader(false),
      reduceMotion ? 450 : LOAD_MS
    )
    return () => window.clearTimeout(done)
  }, [reduceMotion])

  return (
    <div className={styles.shell}>
      <div className={styles.themeCorner}>
        <ThemeToggle variant="compact" />
      </div>
      <div className={styles.ambient} aria-hidden>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={styles.grid} />
      </div>

      <AnimatePresence mode="wait">
        {showLoader ? (
          <motion.div
            key="loader"
            className={styles.loaderLayer}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: reduceMotion ? 1 : 1.04,
              filter: reduceMotion ? 'blur(0px)' : 'blur(8px)',
            }}
            transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            <DualRingLoader size={120} label="Starting WesleyLedger" />
            <span className={styles.loaderLabel}>WesleyLedger</span>
            <div className={styles.progressTrack} aria-hidden>
              <motion.div
                className={styles.progressFill}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduceMotion ? 0.35 : LOAD_MS / 1000, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.main
            key="hero"
            className={styles.hero}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0.25 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.05 }}
            >
              <span className={styles.badge}>
                <span className={styles.badgeDot} />
                Methodist Church Ghana
              </span>
            </motion.div>

            <motion.h1
              className={styles.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.12 }}
            >
              WesleyLedger
            </motion.h1>

            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.2 }}
            >
              Financial stewardship for your society—offline-first ledgers, automated remittances,
              and audit-ready quarterly reports.
            </motion.p>

            <motion.div
              className={styles.pills}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.28 }}
            >
              {['Receipt & payment', 'GRI & remittance', 'Quarterly PDF'].map((t) => (
                <span key={t} className={styles.pill}>
                  {t}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.36 }}
            >
              <button
                type="button"
                className={styles.cta}
                onClick={() => navigate('/auth')}
              >
                Continue
                <span className={styles.ctaIcon} aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </motion.div>

            <motion.p
              className={styles.footerNote}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.5 }}
            >
              v1.0 · Local-first · Encrypted backup (coming soon)
            </motion.p>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}
