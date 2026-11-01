import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore'
import { app } from '../firebase'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/ToastContext'
import type { UserMetadata, UserSubscription, SubscriptionPlan } from '../sync/subTypes'

type ManagedAccount = UserMetadata & { subscription?: UserSubscription }

const plans: { value: SubscriptionPlan; label: string }[] = [
  { value: '1_week', label: '1 Week' },
  { value: '2_weeks', label: '2 Weeks' },
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' },
  { value: 'lifetime', label: 'Lifetime' },
]

function addPlanDuration(start: Date, plan: SubscriptionPlan) {
  const expires = new Date(start)
  if (plan === '1_week') expires.setDate(expires.getDate() + 7)
  else if (plan === '2_weeks') expires.setDate(expires.getDate() + 14)
  else if (plan === '1_month') expires.setMonth(expires.getMonth() + 1)
  else if (plan === '3_months') expires.setMonth(expires.getMonth() + 3)
  else if (plan === '6_months') expires.setMonth(expires.getMonth() + 6)
  else if (plan === '1_year') expires.setFullYear(expires.getFullYear() + 1)
  else expires.setFullYear(expires.getFullYear() + 100)
  return expires
}

export function DevConsolePage() {
  const { session, signOut } = useAuth()
  const { showToast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [adminCheckError, setAdminCheckError] = useState('')
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadAccounts = useCallback(async () => {
    if (!app) return
    const db = getFirestore(app)
    const [metadataSnapshot, subscriptionSnapshot] = await Promise.all([
      getDocs(collection(db, 'users_metadata')),
      getDocs(collection(db, 'subscriptions')),
    ])
    const subscriptions = new Map(
      subscriptionSnapshot.docs.map((entry) => [entry.id, entry.data() as UserSubscription])
    )
    setAccounts(metadataSnapshot.docs.map((entry) => ({
      ...entry.data(),
      uid: entry.id,
      subscription: subscriptions.get(entry.id),
    } as ManagedAccount)).sort((a, b) => a.email.localeCompare(b.email)))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function checkAdmin() {
      if (!app || !session?.user.id) {
        if (!cancelled) {
          setIsAdmin(false)
          setPageLoading(false)
        }
        return
      }
      try {
        const db = getFirestore(app)
        const adminDoc = await getDoc(doc(db, 'admins', session.user.id))
        if (cancelled) return
        setIsAdmin(adminDoc.exists())
        if (!adminDoc.exists()) {
          setAdminCheckError(`No document was found at admins/${session.user.id} in Firebase project ${app.options.projectId ?? '(unknown)'}.`)
        }
        if (adminDoc.exists()) await loadAccounts()
      } catch (error) {
        console.error('Could not verify admin access:', error)
        if (!cancelled) {
          setIsAdmin(false)
          const detail = error instanceof Error ? error.message : String(error)
          setAdminCheckError(`Firestore could not read admins/${session.user.id} in project ${app.options.projectId ?? '(unknown)'}: ${detail}`)
        }
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }
    void checkAdmin()
    return () => { cancelled = true }
  }, [session?.user.id, loadAccounts])

  async function updateSubscription(account: ManagedAccount, plan: SubscriptionPlan, status: 'active' | 'halted') {
    if (!app) return
    setBusy(account.uid)
    const now = new Date()
    const currentExpiry = account.subscription?.expiresAt ? new Date(account.subscription.expiresAt) : now
    const start = status === 'active' && currentExpiry > now ? currentExpiry : now
    const expiresAt = status === 'active' ? addPlanDuration(start, plan) : currentExpiry
    try {
      await setDoc(doc(getFirestore(app), 'subscriptions', account.uid), {
        userId: account.uid,
        status,
        planType: plan,
        startsAt: status === 'active' ? now.toISOString() : account.subscription?.startsAt ?? now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString(),
        grantedBy: session?.user.id ?? '',
        haltReason: status === 'halted' ? 'Payment overdue. Please contact the developer after paying.' : '',
      }, { merge: true })
      showToast(
        status === 'active'
          ? `${account.email} can now access WesleyLedger. Plan: ${plan.replaceAll('_', ' ')}.`
          : `${account.email}'s access has been suspended.`,
        status === 'active' ? 'success' : 'info',
        status === 'active' ? 'Access granted' : 'Access suspended'
      )
      try {
        await loadAccounts()
      } catch (error) {
        console.error('Subscription was updated, but the account list could not refresh:', error)
        showToast('The change was saved, but the list did not refresh. Reload the admin page.', 'info', 'Refresh needed')
      }
    } catch (error) {
      console.error('Could not update subscription:', error)
      showToast('Could not save the access change. Check the Firestore rules and try again.', 'error', 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  if (pageLoading || isAdmin === null) {
    return <main style={styles.center}>Checking administrator access…</main>
  }
  if (!isAdmin) return (
    <main style={styles.center}>
      <section style={{ maxWidth: 520, padding: 32, textAlign: 'center' }}>
        <h1>Admin access not verified</h1>
        <p>
          This account is signed in, but WesleyLedger could not find its administrator
          record. Check that the document ID in the <code>admins</code> collection exactly
          matches this account's Firebase Authentication UID and that both are in the same project.
        </p>
        <p role="status" style={{ overflowWrap: 'anywhere', fontSize: 13, color: '#64746b' }}>
          {adminCheckError || `Signed-in UID: ${session?.user.id ?? '(unavailable)'}`}
        </p>
        <button type="button" style={styles.secondaryButton} onClick={() => void signOut()}>
          Sign out
        </button>
      </section>
    </main>
  )

  const filtered = accounts.filter((account) =>
    `${account.email} ${account.displayName} ${account.uid}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>WesleyLedger · Administration</p>
          <h1 style={styles.title}>Subscriptions</h1>
          <p style={styles.subtitle}>Review accounts and update access after confirming payment.</p>
        </div>
        <button style={styles.secondaryButton} onClick={() => void signOut()}>Sign out</button>
      </header>
      <section style={styles.toolbar}>
        <span>{accounts.length} registered account{accounts.length === 1 ? '' : 's'}</span>
        <input aria-label="Search accounts" placeholder="Search email or name" value={search} onChange={(event) => setSearch(event.target.value)} style={styles.search} />
      </section>
      {filtered.length === 0 ? <p style={styles.empty}>No matching accounts found.</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>{['Account', 'User ID', 'Status', 'Plan', 'Expires', 'Access'].map((heading) => <th key={heading} style={styles.th}>{heading}</th>)}</tr></thead>
            <tbody>{filtered.map((account) => {
              const active = account.subscription?.status === 'active' && Date.parse(account.subscription.expiresAt) > Date.now()
              return <AccountRow key={account.uid} account={account} active={active} busy={busy === account.uid} onUpdate={updateSubscription} />
            })}</tbody>
          </table>
        </div>
      )}
    </main>
  )
}

function AccountRow({ account, active, busy, onUpdate }: {
  account: ManagedAccount
  active: boolean
  busy: boolean
  onUpdate: (account: ManagedAccount, plan: SubscriptionPlan, status: 'active' | 'halted') => Promise<void>
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>('1_month')
  const subscription = account.subscription
  return <tr>
    <td style={styles.td}><strong>{account.displayName || 'WesleyLedger user'}</strong><br /><span style={styles.muted}>{account.email}</span></td>
    <td style={styles.uid}>{account.uid}</td>
    <td style={styles.td}><span style={{ ...styles.badge, ...(active ? styles.active : styles.inactive) }}>{active ? 'ACTIVE' : subscription ? 'SUSPENDED' : 'AWAITING PAYMENT'}</span></td>
    <td style={styles.td}>{subscription?.planType ?? '—'}</td>
    <td style={styles.td}>{subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '—'}</td>
    <td style={styles.td}><div style={styles.actions}>
      <select aria-label={`Plan for ${account.email}`} value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)} style={styles.select}>{plans.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <button disabled={busy} style={styles.grantButton} onClick={() => void onUpdate(account, plan, 'active')}>{busy ? 'Saving…' : 'Confirm payment & grant'}</button>
      {subscription && active && <button disabled={busy} style={styles.haltButton} onClick={() => void onUpdate(account, subscription.planType ?? plan, 'halted')}>Suspend</button>}
    </div></td>
  </tr>
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', padding: '36px clamp(16px, 4vw, 56px)', background: '#f5f7f6', color: '#17221d', fontFamily: 'Inter, system-ui, sans-serif' },
  center: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7f6', color: '#33443b', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, borderBottom: '1px solid #dce5df', paddingBottom: 24 },
  eyebrow: { margin: '0 0 8px', color: '#428365', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  title: { margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.04em' },
  subtitle: { margin: '8px 0 0', color: '#64746b' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '22px 0', color: '#56665d', fontSize: 14 },
  search: { width: 'min(320px, 100%)', padding: '10px 12px', border: '1px solid #cad7ce', borderRadius: 8, background: '#fff', font: 'inherit' },
  tableWrap: { overflowX: 'auto', border: '1px solid #dce5df', borderRadius: 12, background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 950, textAlign: 'left' },
  th: { padding: '14px 16px', background: '#f8faf8', color: '#718078', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e5ebe7' },
  td: { padding: '14px 16px', borderBottom: '1px solid #edf1ee', fontSize: 13, verticalAlign: 'middle' },
  uid: { padding: '14px 16px', borderBottom: '1px solid #edf1ee', color: '#75837b', fontFamily: 'monospace', fontSize: 11 },
  muted: { color: '#718078', fontSize: 12 },
  badge: { display: 'inline-block', padding: '5px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' },
  active: { color: '#22734f', background: '#e3f4ea' },
  inactive: { color: '#936315', background: '#fff2d9' },
  actions: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  select: { padding: '8px 9px', border: '1px solid #d5dfd8', borderRadius: 7, background: '#fff', color: '#26372e' },
  grantButton: { padding: '8px 10px', border: 0, borderRadius: 7, background: '#16764f', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  haltButton: { padding: '8px 10px', border: '1px solid #edcaca', borderRadius: 7, background: '#fff', color: '#a43d3d', fontWeight: 700, cursor: 'pointer' },
  secondaryButton: { padding: '9px 14px', border: '1px solid #cad7ce', borderRadius: 8, background: '#fff', color: '#34463b', fontWeight: 700, cursor: 'pointer' },
  empty: { padding: 30, color: '#718078', textAlign: 'center' },
  message: { color: '#24704f', fontSize: 14 },
}
