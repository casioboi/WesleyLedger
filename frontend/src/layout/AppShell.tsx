import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeToggle } from '../components/ThemeToggle'
import { useChurchProfile } from '../context/useChurchProfile'
import { useAuth } from '../context/useAuth'
import { formatQuarterLabel, type Quarter } from '../lib/quarters'
import { useLedger } from '../ledger/useLedger'
import styles from './AppShell.module.css'

const nav = [
  { to: '/app', end: true, label: 'Home', icon: IconHome },
  { to: '/app/ledger', end: false, label: 'Ledger', icon: IconLedger },
  { to: '/app/entries', end: false, label: 'Entries', icon: IconEntries },
  { to: '/app/reports', end: false, label: 'Reports', icon: IconReports },
  { to: '/app/settings', end: false, label: 'Settings', icon: IconSettings },
] as const

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useChurchProfile()
  const { year, quarter, setQuarter } = useLedger()
  const { signOut } = useAuth()
  const [quarterMenuOpen, setQuarterMenuOpen] = useState(false)
  const quarterMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!quarterMenuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (!quarterMenuRef.current?.contains(e.target as Node)) {
        setQuarterMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setQuarterMenuOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [quarterMenuOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={styles.grid} />
      </div>

      <header className={styles.header}>
        <div className={styles.brand}>
          <img
            src="/wesleyLedger-logo.png"
            alt="WesleyLedger Logo"
            className={styles.logo}
          />
          <div className={styles.brandText}>
            <span className={styles.appName}>WesleyLedger</span>
            <span className={styles.society}>{profile.society}</span>
            <span className={styles.churchMeta}>
              {profile.circuit} · {profile.diocese}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle variant="compact" />
          <div className={styles.quarterPicker} ref={quarterMenuRef}>
            <button
              type="button"
              className={styles.pill}
              onClick={() => setQuarterMenuOpen((open) => !open)}
              aria-expanded={quarterMenuOpen}
              aria-haspopup="menu"
              aria-label="Choose reporting quarter"
            >
              {formatQuarterLabel(year, quarter)}
            </button>
            {quarterMenuOpen ? (
              <div className={styles.quarterMenu} role="menu" aria-label="Quarter list">
                {([1, 2, 3, 4] as const).map((q) => {
                  const active = quarter === q
                  return (
                    <button
                      key={q}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={`${styles.quarterOption} ${active ? styles.quarterOptionActive : ''}`}
                      onClick={() => {
                        setQuarter(year, q as Quarter)
                        setQuarterMenuOpen(false)
                      }}
                    >
                      {formatQuarterLabel(year, q)}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.signOut} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sideNav} aria-label="Main navigation">
          <nav className={styles.sideList}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.sideLink} ${isActive ? styles.sideLinkActive : ''}`
                }
              >
                <item.icon className={styles.sideIcon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className={styles.pageWrap}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label="Primary">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`
            }
          >
            <item.icon className={styles.tabIcon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  )
}

function IconLedger({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconReports({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function IconEntries({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      <path d="M7 6v12" opacity="0.7" />
    </svg>
  )
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  )
}
