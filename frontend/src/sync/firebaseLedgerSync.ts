import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  applyPayloadToLocalStores,
  collectLocalPayload,
  parseWesleyLedgerPayloadV1,
} from './wesleyLedgerPayload'
import { readLastIntegratedRemoteAt, writeLastIntegratedRemoteAt } from './cloudSyncMeta'

type LedgerRow = {
  payload: unknown
  updated_at: string
}

export async function pushLocalLedgerToCloud(userId: string): Promise<void> {
  const payload = collectLocalPayload()
  const now = new Date().toISOString()
  
  const docRef = doc(db, 'user_ledger_data', userId)
  await setDoc(docRef, {
    payload,
    updated_at: now
  }, { merge: true })
  
  writeLastIntegratedRemoteAt(userId, now)
}

async function fetchRemoteRow(userId: string): Promise<LedgerRow | null> {
  const docRef = doc(db, 'user_ledger_data', userId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) return null
  
  const data = docSnap.data()
  if (typeof data.updated_at !== 'string') return null
  
  return { payload: data.payload, updated_at: data.updated_at }
}

/** Apply cloud data only when the server row is newer than what this device last integrated. */
export async function pullRemoteLedgerIfNewer(userId: string): Promise<void> {
  const row = await fetchRemoteRow(userId)
  if (!row) return
  
  const last = readLastIntegratedRemoteAt(userId)
  const remoteNewer =
    !last || new Date(row.updated_at).getTime() > new Date(last).getTime()
    
  if (!remoteNewer) return
  
  const parsed = parseWesleyLedgerPayloadV1(row.payload)
  if (parsed) {
    applyPayloadToLocalStores(parsed)
    writeLastIntegratedRemoteAt(userId, row.updated_at)
  }
}

/**
 * Pull newer cloud data into local storage when the server copy is ahead of what this device last integrated,
 * then push the current local snapshot (so a brand-new empty cloud row gets seeded from this device).
 */
export async function integrateRemoteLedgerThenPush(userId: string): Promise<void> {
  const row = await fetchRemoteRow(userId)

  if (!row) {
    await pushLocalLedgerToCloud(userId)
    return
  }

  const last = readLastIntegratedRemoteAt(userId)
  const remoteNewer =
    !last || new Date(row.updated_at).getTime() > new Date(last).getTime()
    
  if (remoteNewer) {
    const parsed = parseWesleyLedgerPayloadV1(row.payload)
    if (parsed) {
      applyPayloadToLocalStores(parsed)
      writeLastIntegratedRemoteAt(userId, row.updated_at)
    }
  }

  await pushLocalLedgerToCloud(userId)
}
