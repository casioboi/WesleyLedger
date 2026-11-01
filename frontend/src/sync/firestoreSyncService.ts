/**
 * firestoreSyncService.ts
 *
 * Real-time Firestore Subcollection Sync
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *   users/{userId}/
 *     ├── transactions/{txId}    — one doc per transaction
 *     ├── profile/default        — church profile
 *     └── settings/ledger        — activeQuarter, griOverrides, customLines
 *
 * Why subcollections instead of a blob?
 *   - Firebase Offline Persistence caches individual docs, not blobs.
 *     With subcollections, every write/delete is tracked individually and
 *     replayed when the device comes back online.
 *   - APK updates cannot corrupt partial data: each record is independent.
 *   - No more timestamp-comparison hacks. onSnapshot() is the source of truth.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { LedgerTransaction } from '../ledger/ledgerTypes'
import type { ChurchProfile } from '../lib/churchProfileModel'
import type { CustomLinesPayload } from '../ledger/customLinesStore'
import type { Quarter } from '../lib/quarters'

// ─── Firestore path helpers ───────────────────────────────────────────────────

function txCol(userId: string) {
  return collection(db!, 'users', userId, 'transactions')
}
function txDoc(userId: string, txId: string) {
  return doc(db!, 'users', userId, 'transactions', txId)
}
function profileDoc(userId: string) {
  return doc(db!, 'users', userId, 'profile', 'default')
}
function settingsDoc(userId: string) {
  return doc(db!, 'users', userId, 'settings', 'ledger')
}

function getDb() {
  if (!db) throw new Error('Cloud sync is not configured for this build.')
  return db
}

// ─── Settings type ────────────────────────────────────────────────────────────

export type LedgerSettings = {
  activeQuarter: { year: number; quarter: Quarter }
  griOverrides: Record<string, boolean>
  customLines?: CustomLinesPayload
}

// ─── Migration: push existing local blob data into subcollections ─────────────

/**
 * Called once on first login after the refactor.
 * Pushes all existing local transactions, profile, and settings up
 * to the new subcollection structure in a single batch write.
 */
export async function migrateLocalDataToSubcollections(
  userId: string,
  transactions: LedgerTransaction[],
  profile: ChurchProfile,
  settings: LedgerSettings
): Promise<void> {
  getDb()
  const BATCH_LIMIT = 500
  let batch = writeBatch(db!)
  let opCount = 0

  const flush = async () => {
    if (opCount > 0) {
      await batch.commit()
      batch = writeBatch(db!)
      opCount = 0
    }
  }

  for (const tx of transactions) {
    batch.set(txDoc(userId, tx.id), sanitize(tx))
    opCount++
    if (opCount >= BATCH_LIMIT) await flush()
  }

  batch.set(profileDoc(userId), sanitize(profile))
  opCount++
  batch.set(settingsDoc(userId), sanitize(settings))
  opCount++

  await flush()
  console.log(`[firestoreSync] Migrated ${transactions.length} transactions + profile + settings.`)
}

// ─── Real-time listener ───────────────────────────────────────────────────────

export type RemoteTransactionsCallback = (transactions: LedgerTransaction[]) => void

/**
 * Opens a real-time onSnapshot listener on the transactions subcollection.
 * Firebase Offline Persistence ensures this works even while offline —
 * the listener fires immediately from cache, then again when online data arrives.
 * Returns an unsubscribe function.
 */
export function subscribeRemoteTransactions(
  userId: string,
  onChange: RemoteTransactionsCallback
): Unsubscribe {
  getDb()
  const col = txCol(userId)
  return onSnapshot(
    col,
    { includeMetadataChanges: false },
    (snapshot) => {
      const txs: LedgerTransaction[] = []
      snapshot.forEach((d) => {
        const data = d.data() as Record<string, unknown>
        const tx = parseTx(data)
        if (tx) txs.push(tx)
      })
      onChange(txs)
    },
    (err) => {
      console.error('[firestoreSync] onSnapshot error:', err)
    }
  )
}

// ─── Individual write/delete helpers (called by LedgerProvider) ───────────────

/** Write a single transaction to Firestore. Queued when offline, synced when online. */
export async function upsertRemoteTransaction(
  userId: string,
  tx: LedgerTransaction
): Promise<void> {
  getDb()
  await setDoc(txDoc(userId, tx.id), sanitize(tx))
}

/** Delete a single transaction from Firestore. Safe to call while offline. */
export async function deleteRemoteTransaction(
  userId: string,
  txId: string
): Promise<void> {
  getDb()
  await deleteDoc(txDoc(userId, txId))
}

/** Write the church profile document. */
export async function upsertRemoteProfile(
  userId: string,
  profile: ChurchProfile
): Promise<void> {
  getDb()
  await setDoc(profileDoc(userId), sanitize(profile))
}

/** Read the church profile (used for initial load). */
export async function fetchRemoteProfile(userId: string): Promise<ChurchProfile | null> {
  getDb()
  const snap = await getDoc(profileDoc(userId))
  if (!snap.exists()) return null
  return snap.data() as ChurchProfile
}

/** Write ledger settings (quarter, GRI overrides, custom lines). */
export async function upsertRemoteSettings(
  userId: string,
  settings: LedgerSettings
): Promise<void> {
  getDb()
  await setDoc(settingsDoc(userId), sanitize(settings))
}

/** Read ledger settings (used for initial load after login). */
export async function fetchRemoteSettings(userId: string): Promise<LedgerSettings | null> {
  getDb()
  const snap = await getDoc(settingsDoc(userId))
  if (!snap.exists()) return null
  return snap.data() as LedgerSettings
}

/** Fetch all remote transactions once (used for initial login pull). */
export async function fetchAllRemoteTransactions(userId: string): Promise<LedgerTransaction[]> {
  getDb()
  const snap = await getDocs(txCol(userId))
  const txs: LedgerTransaction[] = []
  snap.forEach((d) => {
    const tx = parseTx(d.data() as Record<string, unknown>)
    if (tx) txs.push(tx)
  })
  return txs
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function parseTx(r: Record<string, unknown>): LedgerTransaction | null {
  if (
    typeof r.id === 'string' &&
    typeof r.dateIso === 'string' &&
    (r.kind === 'income' || r.kind === 'expenditure') &&
    typeof r.lineId === 'string' &&
    typeof r.amountMinor === 'number' &&
    Number.isFinite(r.amountMinor) &&
    r.amountMinor >= 0 &&
    typeof r.createdAt === 'string'
  ) {
    return {
      id: r.id,
      dateIso: r.dateIso,
      kind: r.kind,
      lineId: r.lineId,
      amountMinor: Math.round(r.amountMinor),
      note: typeof r.note === 'string' ? r.note : undefined,
      createdAt: r.createdAt,
    }
  }
  return null
}
