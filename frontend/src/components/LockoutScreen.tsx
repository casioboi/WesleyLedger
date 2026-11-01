import { motion, useReducedMotion } from 'framer-motion'
import type { UserSubscription } from '../sync/subTypes'
import styles from './LockoutScreen.module.css'

interface LockoutScreenProps {
  subscription: UserSubscription
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function LockoutScreen({ subscription }: LockoutScreenProps) {
  const reduceMotion = useReducedMotion()
  const isExpired = subscription.status === 'expired' || Date.parse(subscription.expiresAt) < Date.now()
  const reference = `WL-USR-${subscription.userId.slice(0, 6).toUpperCase()}`

  return (
    <main className={styles.screen} aria-labelledby="access-title">
      <div className={styles.glow} aria-hidden="true" />
      <motion.section
        className={styles.card}
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.36, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={styles.topline}>
          <div className={styles.brandMark} aria-hidden="true">W</div>
          <span className={styles.brandName}>WesleyLedger</span>
          <span className={styles.status}><span className={styles.statusDot} /> Access paused</span>
        </div>

        <div className={styles.content}>
          <div className={styles.iconWrap}><LockIcon /></div>
          <p className={styles.eyebrow}>Subscription update</p>
          <h1 id="access-title" className={styles.title}>
            {isExpired ? 'Your subscription has expired' : 'Access is temporarily paused'}
          </h1>
          <p className={styles.description}>
            {subscription.haltReason || (isExpired
              ? 'Renew your subscription to continue using your ledger and reports.'
              : 'Your account is awaiting access confirmation. Contact your WesleyLedger administrator for help.')}
          </p>

          <div className={styles.referenceCard}>
            <div>
              <span className={styles.referenceLabel}>Client reference</span>
              <strong className={styles.referenceValue}>{reference}</strong>
            </div>
            <span className={styles.referenceTag}>Share when contacting support</span>
          </div>

          <div className={styles.nextSteps}>
            <h2>What to do next</h2>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <p>Contact your WesleyLedger administrator to confirm your subscription or payment.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <p>Include your client reference so they can find the correct account.</p>
            </div>
          </div>

          <p className={styles.footerNote}>Your access will update automatically once it is confirmed.</p>
        </div>
      </motion.section>
      <p className={styles.pageFooter}>Secure financial records for your society</p>
    </main>
  )
}
