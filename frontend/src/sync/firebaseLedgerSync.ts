import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  applyPayloadToLocalStores,
  collectLocalPayload,
  parseWesleyLedgerPayloadV1,
} from './wesleyLedgerPayload'
import { readLastIntegratedRemoteAt, writeLastIntegratedRemoteAt } from './cloudSyncMeta'
import { getLedgerTransactionsSnapshot } from '../ledger/ledgerTransactionsStore'

type LedgerRow = {
  payload: unknown
  updated_at: string
}

function sanitizePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getCloudDb() {
  if (!db) {
    throw new Error('Cloud sync is not configured for this build.')
  }
  return db
}

export async function pushLocalLedgerToCloud(userId: string): Promise<void> {
  const payload = collectLocalPayload()

  // Safety guard: never overwrite cloud data with an empty local state.
  if (payload.transactions.length === 0) {
    console.warn('[sync] Skipping push - local transactions are empty. Pull first.')
    return
  }

  const now = new Date().toISOString()
  const docRef = doc(getCloudDb(), 'user_ledger_data', userId)
  await setDoc(docRef, sanitizePayload({ payload, updated_at: now }), { merge: true })
  writeLastIntegratedRemoteAt(userId, now)
}

async function fetchRemoteRow(userId: string): Promise<LedgerRow | null> {
  const docRef = doc(getCloudDb(), 'user_ledger_data', userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  if (typeof data.updated_at !== 'string') return null

  return { payload: data.payload, updated_at: data.updated_at }
}

export async function pullRemoteLedgerIfNewer(userId: string): Promise<boolean> {
  const row = await fetchRemoteRow(userId)
  if (!row) return false

  const last = readLastIntegratedRemoteAt(userId)
  const localCount = getLedgerTransactionsSnapshot().length
  
  // Safety override: if the local database is completely wiped (e.g. after an APK update),
  // we must ignore timestamps and always pull from the cloud.
  const isLocalEmpty = localCount === 0
  
  const remoteNewer =
    !last || new Date(row.updated_at).getTime() > new Date(last).getTime()

  if (!remoteNewer && !isLocalEmpty) return false

  const parsed = parseWesleyLedgerPayloadV1(row.payload)
  if (parsed) {
    // Safety guard: if local has MORE transactions than the remote snapshot,
    // the remote is likely a stale/partial push. Skip auto-pull to protect
    // local data. The user can still force-pull via Settings if needed.
    const localCount = getLedgerTransactionsSnapshot().length
    if (localCount > 0 && parsed.transactions.length < localCount) {
      console.warn(
        `[sync] Auto-pull skipped — remote has ${parsed.transactions.length} txs but local has ${localCount}. Remote snapshot may be stale. Use Force Pull in Settings to override.`
      )
      return false
    }
    applyPayloadToLocalStores(parsed)
    writeLastIntegratedRemoteAt(userId, row.updated_at)
    return true
  }
  return false
}

export async function forcePullFromCloud(userId: string): Promise<boolean> {
  const row = await fetchRemoteRow(userId)
  if (!row) return false

  const parsed = parseWesleyLedgerPayloadV1(row.payload)
  if (parsed) {
    applyPayloadToLocalStores(parsed)
    writeLastIntegratedRemoteAt(userId, row.updated_at)
    return true
  }
  return false
}

export async function forcePushToCloud(userId: string): Promise<void> {
  const payload = collectLocalPayload()
  const now = new Date().toISOString()
  const docRef = doc(getCloudDb(), 'user_ledger_data', userId)
  await setDoc(docRef, sanitizePayload({ payload, updated_at: now }), { merge: true })
  writeLastIntegratedRemoteAt(userId, now)
}

/** @deprecated Use pullRemoteLedgerIfNewer + pushLocalLedgerToCloud separately. */
export async function integrateRemoteLedgerThenPush(userId: string): Promise<void> {
  await pullRemoteLedgerIfNewer(userId)
  await pushLocalLedgerToCloud(userId)
}
