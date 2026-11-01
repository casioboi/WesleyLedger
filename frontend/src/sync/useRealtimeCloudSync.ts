/**
 * useRealtimeCloudSync.ts
 *
 * Replaces useLedgerCloudSync.ts.
 * Wires the Firestore subcollection real-time listener into the local stores.
 *
 * Behaviour:
 *  - While LOGGED OUT: local stores are the source of truth (no Firestore calls).
 *  - On LOGIN: pull remote transactions + settings once, apply to local stores,
 *    then migrate any local-only transactions up to Firestore.
 *  - After login: onSnapshot keeps remote and local in sync in real-time.
 *  - Every addTransaction / removeTransaction write also goes to Firestore
 *    (handled via the LedgerProvider patch — see comments below).
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '../context/useAuth'
import {
  subscribeRemoteTransactions,
  fetchAllRemoteTransactions,
  fetchRemoteProfile,
  fetchRemoteSettings,
  migrateLocalDataToSubcollections,
  type LedgerSettings,
} from './firestoreSyncService'
import {
  getLedgerTransactionsSnapshot,
  setLedgerTransactions,
} from '../ledger/ledgerTransactionsStore'
import {
  getChurchProfileStorageSnapshot,
  applyChurchProfileFromSync,
} from '../context/ChurchProfileProvider'
import {
  getGriOverridesSnapshot,
  replaceGriOverrides,
} from '../gri/griOverridesStore'
import {
  loadActiveQuarter,
  saveActiveQuarter,
} from '../ledger/activeQuarterStorage'
import {
  getCustomLinesSnapshot,
  setCustomLines,
} from '../ledger/customLinesStore'

/** Flag persisted in localStorage so we only migrate once per device/account. */
function getMigrationKey(userId: string) {
  return `wesleyLedger.subcollMigrated.v1.${userId}`
}
function isMigrated(userId: string): boolean {
  return localStorage.getItem(getMigrationKey(userId)) === 'true'
}
function markMigrated(userId: string) {
  localStorage.setItem(getMigrationKey(userId), 'true')
}

export function useRealtimeCloudSync() {
  const { session, loading, configured } = useAuth()
  const userId = session?.user.id
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!configured || loading || !userId) {
      initializedRef.current = false
      return
    }
    if (initializedRef.current) return
    initializedRef.current = true

    let unsubscribe: (() => void) | null = null

    async function init() {
      // ── Step 1: pull remote data and apply to local stores ──────────────────
      try {
        const [remoteTxs, remoteProfile, remoteSettings] = await Promise.all([
          fetchAllRemoteTransactions(userId!),
          fetchRemoteProfile(userId!),
          fetchRemoteSettings(userId!),
        ])

        const localTxs = getLedgerTransactionsSnapshot()

        if (remoteTxs.length > 0) {
          // Merge: remote is authoritative, but keep any local-only records too
          // (i.e. local records added while offline that haven't synced yet).
          const remoteIds = new Set(remoteTxs.map((t) => t.id))
          const localOnly = localTxs.filter((t) => !remoteIds.has(t.id))
          const merged = [...remoteTxs, ...localOnly]
          setLedgerTransactions(merged)
        } else if (localTxs.length > 0 && !isMigrated(userId!)) {
          // ── Step 2: migration — push local data up to subcollections ─────────
          const profile = getChurchProfileStorageSnapshot()
          const aq = loadActiveQuarter()
          const settings: LedgerSettings = {
            activeQuarter: { year: aq.year, quarter: aq.quarter },
            griOverrides: { ...getGriOverridesSnapshot() },
            customLines: getCustomLinesSnapshot(),
          }
          await migrateLocalDataToSubcollections(
            userId!,
            localTxs,
            profile ?? { society: '', circuit: '', diocese: '', updatedAt: '' },
            settings
          )
          markMigrated(userId!)
          console.log('[realtimeSync] Local-to-subcollection migration complete.')
        }

        if (remoteProfile) {
          applyChurchProfileFromSync(remoteProfile)
        }

        if (remoteSettings) {
          replaceGriOverrides(remoteSettings.griOverrides ?? {})
          saveActiveQuarter(
            remoteSettings.activeQuarter.year,
            remoteSettings.activeQuarter.quarter
          )
          if (remoteSettings.customLines) {
            setCustomLines(remoteSettings.customLines)
          }
        }
      } catch (e) {
        console.error('[realtimeSync] Initial pull failed (offline?):', e)
      }

      // ── Step 3: open real-time listener ──────────────────────────────────────
      // Firebase Offline Persistence means this listener fires from cache
      // immediately, even when offline. It automatically reconciles when online.
      unsubscribe = subscribeRemoteTransactions(userId!, (remoteTxs) => {
        if (remoteTxs.length === 0) return // Avoid wiping local on empty remote during init

        const localTxs = getLedgerTransactionsSnapshot()
        const remoteIds = new Set(remoteTxs.map((t) => t.id))
        const localOnly = localTxs.filter((t) => !remoteIds.has(t.id))

        // If there are local-only records (written while offline), keep them
        // alongside the remote ones until they get synced up.
        if (localOnly.length > 0) {
          setLedgerTransactions([...remoteTxs, ...localOnly])
        } else {
          setLedgerTransactions(remoteTxs)
        }
      })
    }

    init()

    return () => {
      if (unsubscribe) unsubscribe()
      initializedRef.current = false
    }
  }, [configured, loading, userId])
}
