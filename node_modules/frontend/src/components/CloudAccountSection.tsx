import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/ToastContext'
import { integrateRemoteLedgerThenPush } from '../sync/supabaseLedgerSync'
import pageStyles from '../pages/PlaceholderPage.module.css'
import local from '../pages/SettingsPage.module.css'

function getErrorMessage(error: unknown): string {
  if (!error) return 'Sync failed.'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || 'Sync failed.'
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message.length > 0) return obj.message
    if (typeof obj.error === 'string' && obj.error.length > 0) return obj.error
    if (typeof obj.msg === 'string' && obj.msg.length > 0) return obj.msg
    try {
      return JSON.stringify(error)
    } catch {
      return 'Sync failed.'
    }
  }
  return String(error)
}

export function CloudAccountSection() {
  const { session, loading, configured, signInWithEmail, signUpWithEmail, signOut } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSyncNow() {
    const uid = session?.user.id
    if (!uid) {
      showToast('Please sign in before syncing.', 'error')
      return
    }
    setBusy(true)
    try {
      await integrateRemoteLedgerThenPush(uid)
      showToast('Cloud sync finished. Your ledger matches the server for this account.', 'success')
    } catch (e) {
      console.error('Sync now failed', e)
      showToast(getErrorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function onSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const { error } = await signInWithEmail(email, password)
    setBusy(false)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Signed in. Your data will sync in the background.', 'success')
      setPassword('')
    }
  }

  async function onSignUp() {
    setBusy(true)
    const { error } = await signUpWithEmail(email, password)
    setBusy(false)
    if (error) showToast(error.message, 'error')
    else {
      showToast(
        'Check your email to confirm your account if required, then sign in. Local data will upload after login.',
        'info'
      )
      setPassword('')
    }
  }

  async function onSignOut() {
    setBusy(true)
    await signOut()
    setBusy(false)
    showToast('Signed out. This device keeps working offline with local data.', 'info')
  }

  return (
    <section className={local.cloud} aria-labelledby="cloud-sync-heading">
      <h2 id="cloud-sync-heading" className={local.profileTitle}>
        Cloud account &amp; sync
      </h2>
      <p className={local.profileHint}>
        Sign in on a replacement device to restore your ledger, church profile, and GRI settings. Day-to-day entry still
        works offline; changes upload when you are online.
      </p>

      {!configured ? (
        <p className={pageStyles.text}>
          Cloud sync is not configured for this build. Add <code className={local.code}>VITE_SUPABASE_URL</code> and{' '}
          <code className={local.code}>VITE_SUPABASE_ANON_KEY</code> to your environment, run the SQL in{' '}
          <code className={local.code}>frontend/supabase/ledger_sync.sql</code>, then rebuild.
        </p>
      ) : loading ? (
        <p className={local.profileHint}>Loading session…</p>
      ) : session ? (
        <div className={local.cloudSignedIn}>
          <p className={local.cloudEmail}>
            Signed in as <strong>{session.user.email ?? session.user.id}</strong>
          </p>
          <div className={local.cloudActions}>
            <button type="button" className={local.saveBtn} disabled={busy} onClick={onSyncNow}>
              Sync now
            </button>
            <button type="button" className={local.resetBtn} disabled={busy} onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <form className={local.cloudForm} onSubmit={onSignIn}>
          <label className={local.cloudLabel}>
            Email
            <input
              className={local.cloudInput}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className={local.cloudLabel}>
            Password
            <input
              className={local.cloudInput}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <div className={local.cloudActions}>
            <button type="submit" className={local.saveBtn} disabled={busy}>
              Sign in
            </button>
            <button type="button" className={local.resetBtn} disabled={busy} onClick={onSignUp}>
              Create account
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
