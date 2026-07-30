import { useEffect } from 'react'
import { Network } from '@capacitor/network'
import { useAuth } from '../context/useAuth'
import { subscribeChurchProfileStore } from '../context/ChurchProfileProvider'
import { subscribeGriOverrides } from '../gri/griOverridesStore'
import { subscribeActiveQuarter } from '../ledger/activeQuarterStorage'
import { subscribeLedgerTransactions } from '../ledger/ledgerTransactionsStore'
import {
  integrateRemoteLedgerThenPush,
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
 * When the user is signed in, pulls newer cloud data once per session user id, then keeps the cloud
 * copy updated (debounced) after local changes. Works offline: pushes resume when the device is online.
 */
export function useLedgerCloudSync() {
  const { session, loading, configured } = useAuth()
  const userId = session?.user.id

  useEffect(() => {
    if (!configured || loading || !userId) return
    integrateRemoteLedgerThenPush(userId).catch(() => {
      /* surfaced via Settings if user runs manual sync */
    })
  }, [configured, loading, userId])

  useEffect(() => {
    if (!configured || !userId) return

    const push = async () => {
      // Use Capacitor network for reliable check
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

    let networkListener: any = null
    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        push()
      }
    }).then(listener => {
      networkListener = listener
    })

    const onOnline = () => {
      push()
    }
    window.addEventListener('online', onOnline)

    return () => {
      debounced.cancel()
      unsubs.forEach((u) => u())
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
