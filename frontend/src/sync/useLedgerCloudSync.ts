import { useEffect } from 'react'
import { Network } from '@capacitor/network'
import { useAuth } from '../context/useAuth'
import { subscribeChurchProfileStore } from '../context/ChurchProfileProvider'
import { subscribeGriOverrides } from '../gri/griOverridesStore'
import { subscribeActiveQuarter } from '../ledger/activeQuarterStorage'
import { subscribeLedgerTransactions } from '../ledger/ledgerTransactionsStore'
import { getLedgerTransactionsSnapshot } from '../ledger/ledgerTransactionsStore'
import {
  pullRemoteLedgerIfNewer,
  pushLocalLedgerToCloud,
} from './firebaseLedgerSync'

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
 * Sync strategy:
 * - On login: pull from cloud only.
 * - On local changes: auto-push (debounced), but only when local has transactions.
 * - On network reconnect / tab focus: pull if cloud is newer.
 */
export function useLedgerCloudSync() {
  const { session, loading, configured } = useAuth()
  const userId = session?.user.id

  useEffect(() => {
    if (!configured || loading || !userId) return
    pullRemoteLedgerIfNewer(userId).catch(() => {
      /* errors surface via manual sync in Settings */
    })
  }, [configured, loading, userId])

  useEffect(() => {
    if (!configured || !userId) return

    const push = async () => {
      // Never auto-push empty data; this prevents a fresh device from wiping the cloud.
      const localTxs = getLedgerTransactionsSnapshot()
      if (localTxs.length === 0) return

      const status = await Network.getStatus()
      if (!status.connected) return
      pushLocalLedgerToCloud(userId).catch(() => {})
    }

    const debounced = debounce(push, 2800)

    const unsubs = [
      subscribeLedgerTransactions(debounced),
      subscribeGriOverrides(debounced),
      subscribeChurchProfileStore(debounced),
      subscribeActiveQuarter(debounced),
    ]

    let networkListener: { remove: () => void } | null = null
    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) push()
    }).then((listener) => {
      networkListener = listener
    })

    const onOnline = () => push()
    window.addEventListener('online', onOnline)

    return () => {
      debounced.cancel()
      unsubs.forEach((unsubscribe) => unsubscribe())
      window.removeEventListener('online', onOnline)
      if (networkListener) networkListener.remove()
    }
  }, [configured, userId])

  useEffect(() => {
    if (!configured || !userId) return
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      pullRemoteLedgerIfNewer(userId).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [configured, userId])
}
