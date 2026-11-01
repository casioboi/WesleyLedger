import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/useAuth'
import { getPortalAccess } from '../lib/portalAccess'
import styles from './PortalChoicePage.module.css'

export function PortalChoicePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    const currentUserId = userId
    let cancelled = false
    setChecking(true)
    setError(null)
    async function verifyAccess() {
      try {
        const access = await getPortalAccess(currentUserId)
        if (cancelled) return

        if (access.canUseAdmin) {
          setChecking(false)
          return
        }

        navigate('/app', { replace: true })
      } catch (verificationError) {
        console.error('Could not verify portal access:', verificationError)
        if (!cancelled) {
          setError('We could not verify your portal access. Check your connection and try again.')
          setChecking(false)
        }
      }
    }

    void verifyAccess()
    return () => { cancelled = true }
  }, [navigate, retryCount, userId])

  if (checking) {
    return (
      <main className={styles.shell} aria-live="polite">
        <p className={styles.status}>Checking your portal access…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.shell}>
        <section className={styles.card} aria-labelledby="portal-error-title">
          <p className={styles.eyebrow}>WesleyLedger access</p>
          <h1 id="portal-error-title">Access check unavailable</h1>
          <p className={styles.intro}>{error}</p>
          <button className={styles.retry} type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <div className={styles.themeCorner}>
        <ThemeToggle variant="compact" />
      </div>
      <section className={styles.card} aria-labelledby="portal-title">
        <img className={styles.logo} src="/wesleyLedger-logo.png" alt="" />
        <p className={styles.eyebrow}>WesleyLedger</p>
        <h1 id="portal-title">Where would you like to go?</h1>
        <p className={styles.intro}>
          Your account has access to both workspaces. Choose how you want to continue.
        </p>

        <div className={styles.options}>
          <button
            className={styles.option}
            type="button"
            onClick={() => navigate('/admin')}
          >
            <span className={styles.optionIcon} aria-hidden="true">
              <AdminIcon />
            </span>
            <span className={styles.optionText}>
              <strong>Admin portal</strong>
              <span>Manage accounts, subscriptions, and access.</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </button>

          <button
            className={styles.option}
            type="button"
            onClick={() => navigate('/app')}
          >
            <span className={`${styles.optionIcon} ${styles.userIcon}`} aria-hidden="true">
              <UserIcon />
            </span>
            <span className={styles.optionText}>
              <strong>User workspace</strong>
              <span>Work with your society ledger and reports.</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </button>
        </div>

        <p className={styles.note}>You can choose the other workspace at your next sign-in.</p>
      </section>
    </main>
  )
}

function AdminIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-3.3 3.2-5 7-5s6.3 1.7 7 5" />
    </svg>
  )
}
