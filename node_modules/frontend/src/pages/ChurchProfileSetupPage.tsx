import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useChurchProfile } from '../context/useChurchProfile'
import { ThemeToggle } from '../components/ThemeToggle'
import styles from './ChurchProfileSetupPage.module.css'

export function ChurchProfileSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'

  const { showToast } = useToast()
  const { profile, isComplete, saveProfile } = useChurchProfile()

  const [society, setSociety] = useState(profile.society)
  const [circuit, setCircuit] = useState(profile.circuit)
  const [diocese, setDiocese] = useState(profile.diocese)
  const [error, setError] = useState<string | null>(null)

  if (!isEdit && isComplete) {
    return <Navigate to="/app" replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const s = society.trim()
    const c = circuit.trim()
    const d = diocese.trim()
    if (!s || !c || !d) {
      setError('Please fill in society, circuit, and diocese.')
      return
    }
    saveProfile({ society: s, circuit: c, diocese: d })
    showToast('Church profile saved.')
    if (isEdit) {
      navigate('/app/settings', { replace: true })
    } else {
      navigate('/app', { replace: true })
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.themeCorner}>
        <ThemeToggle variant="compact" />
      </div>
      <div className={styles.ambient} aria-hidden>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={styles.grid} />
      </div>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.cardHeader}>
          <span className={styles.badge}>Church profile</span>
          <h1 className={styles.title}>
            {isEdit ? 'Update your church details' : 'Welcome to WesleyLedger'}
          </h1>
          <p className={styles.lead}>
            {isEdit
              ? 'These names appear on your PDF reports and dashboard.'
              : 'Enter your society, circuit, and diocese once. You can change them later in Settings.'}
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="wl-society">Society name</label>
            <input
              id="wl-society"
              name="society"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Ashalaja Society"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="wl-circuit">Circuit name</label>
            <input
              id="wl-circuit"
              name="circuit"
              type="text"
              autoComplete="off"
              placeholder="e.g. Amanfro"
              value={circuit}
              onChange={(e) => setCircuit(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="wl-diocese">Diocese name</label>
            <input
              id="wl-diocese"
              name="diocese"
              type="text"
              autoComplete="off"
              placeholder="e.g. Northern Accra Diocese"
              value={diocese}
              onChange={(e) => setDiocese(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className={styles.submit}>
            {isEdit ? 'Save changes' : 'Continue to app'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
