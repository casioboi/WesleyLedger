import { useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { getSupabase } from '../lib/supabaseClient'
import { subscribeChurchProfileStore } from '../context/ChurchProfileProvider'
import { subscribeGriOverrides } from '../gri/griOverridesStore'
import { subscribeActiveQuarter } from '../ledger/activeQuarterStorage'
import { subscribeLedgerTransactions } from '../ledger/ledgerTransactionsStore'
import {
  integrateRemoteLedgerThenPush,
  pullRemoteLedgerIfNewer,
  pushLocalLedgerToCloud,
} from './supabaseLedgerSync'

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined
  const wrapped = () => {
    if (t) clearTimeout(t)
    t = setTimeout(fn, ms)
  }
  wrapped.cancel = () => {
    if (t) clearTimeout(t)
  }
  return wrapped as (() => void) & { cancel: () => void }
}

/**
 * When the user is signed in, pulls newer cloud data once per session user id, then keeps the cloud
 * copy updated (debounced) after local changes. Works offline: pushes resume when the device is online.
 */
export function useLedgerCloudSync() {
  const { session, loading, configured } = useAuth()
  const userId = session?.user.id

  useEffect(() => {
    if (!configured || loading || !userId || !getSupabase()) return
    integrateRemoteLedgerThenPush(userId).catch(() => {
      /* surfaced via Settings if user runs manual sync */
    })
  }, [configured, loading, userId])

  useEffect(() => {
    if (!configured || !userId || !getSupabase()) return

    const push = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      pushLocalLedgerToCloud(userId).catch(() => {})
    }

    const debounced = debounce(push, 2800)

    const unsubs = [
      subscribeLedgerTransactions(debounced),
      subscribeGriOverrides(debounced),
      subscribeChurchProfileStore(debounced),
      subscribeActiveQuarter(debounced),
    ]

    const onOnline = () => {
      push()
    }
    window.addEventListener('online', onOnline)

    return () => {
      debounced.cancel()
      unsubs.forEach((u) => u())
      window.removeEventListener('online', onOnline)
    }
  }, [configured, userId])

  useEffect(() => {
    if (!configured || !userId || !getSupabase()) return
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      pullRemoteLedgerIfNewer(userId).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [configured, userId])
}
