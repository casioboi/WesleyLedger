import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/ToastContext'
import { useChurchProfile } from '../context/useChurchProfile'
import { ThemeToggle } from '../components/ThemeToggle'
import styles from './AuthPage.module.css'

export function AuthPage() {
  const navigate = useNavigate()
  const { session, loading, configured, signInWithEmail, signUpWithEmail } = useAuth()
  const { isComplete, saveProfile, profile } = useChurchProfile()
  const { showToast } = useToast()

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [society, setSociety] = useState(profile.society)
  const [circuit, setCircuit] = useState(profile.circuit)
  const [diocese, setDiocese] = useState(profile.diocese)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  useEffect(() => {
    console.group('[WesleyLedger] Supabase env check')
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? supabaseUrl : '<missing>')
    console.log('VITE_SUPABASE_ANON_KEY present:', Boolean(supabaseAnonKey))
    console.groupEnd()
  }, [supabaseUrl, supabaseAnonKey])

  useEffect(() => {
    if (loading) return
    if (session) {
      navigate(isComplete ? '/app' : '/setup', { replace: true })
    }
  }, [loading, session, isComplete, navigate])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const trimmedEmail = email.trim()
    const trimmedPassword = password

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.')
      return
    }

    setBusy(true)

    if (mode === 'signIn') {
      const { error: signInError } = await signInWithEmail(trimmedEmail, trimmedPassword)
      setBusy(false)
      if (signInError) {
        setError(signInError.message)
        return
      }
      showToast('Signed in successfully.', 'success')
      navigate('/app', { replace: true })
      return
    }

    const trimmedSociety = society.trim()
    const trimmedCircuit = circuit.trim()
    const trimmedDiocese = diocese.trim()

    if (!trimmedSociety || !trimmedCircuit || !trimmedDiocese) {
      setError('Please enter society, circuit, and diocese for your account.')
      setBusy(false)
      return
    }

    const { error: signUpError, session: signUpSession } = await signUpWithEmail(trimmedEmail, trimmedPassword)
    setBusy(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }

    saveProfile({ society: trimmedSociety, circuit: trimmedCircuit, diocese: trimmedDiocese })

    if (signUpSession) {
      showToast('Account created and signed in. Loading your dashboard…', 'success')
      navigate('/app', { replace: true })
      return
    }

    setMode('signIn')
    setInfo('Account created. Please sign in with your credentials to continue.')
  }

  if (!configured) {
    return (
      <div className={styles.shell}>
        <div className={styles.themeCorner}>
          <ThemeToggle variant="compact" />
        </div>
        <div className={styles.card}>
          <h1>Supabase is not configured</h1>
          <p>Please add your Supabase environment variables and reload the app.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.themeCorner}>
        <ThemeToggle variant="compact" />
      </div>
      <div className={styles.ambient} aria-hidden />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.cardHeader}>
          <span className={styles.badge}>Account</span>
          <h1>{mode === 'signIn' ? 'Sign in to WesleyLedger' : 'Create a new account'}</h1>
          <p>
            {mode === 'signIn'
              ? 'Use your email and password to restore your secure ledger and sync to Supabase.'
              : 'Create your account and add your society details as part of onboarding.'}
          </p>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            className={`${styles.tab} ${mode === 'signIn' ? styles.active : ''}`}
            onClick={() => {
              setMode('signIn')
              setError(null)
              setInfo(null)
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'signUp' ? styles.active : ''}`}
            onClick={() => {
              setMode('signUp')
              setError(null)
              setInfo(null)
            }}
          >
            Create account
          </button>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="auth-password">Password</label>
            <div className={styles.passwordField}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {mode === 'signUp' ? (
            <>
              <div className={styles.field}>
                <label htmlFor="auth-society">Society name</label>
                <input
                  id="auth-society"
                  type="text"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  placeholder="Ashalaja Society"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-circuit">Circuit name</label>
                <input
                  id="auth-circuit"
                  type="text"
                  value={circuit}
                  onChange={(e) => setCircuit(e.target.value)}
                  placeholder="Amanfro"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-diocese">Diocese name</label>
                <input
                  id="auth-diocese"
                  type="text"
                  value={diocese}
                  onChange={(e) => setDiocese(e.target.value)}
                  placeholder="Northern Accra Diocese"
                  required
                />
              </div>
            </>
          ) : null}

          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          {info ? <div className={styles.info}>{info}</div> : null}

          <button type="submit" className={styles.submit} disabled={busy}>
            {mode === 'signIn' ? 'Continue to app' : 'Create account'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
