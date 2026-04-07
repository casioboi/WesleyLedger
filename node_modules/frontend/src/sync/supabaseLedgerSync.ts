import { getSupabase } from '../lib/supabaseClient'
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
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase client is not configured.')
  const payload = collectLocalPayload()
  const { data, error } = await sb
    .from('user_ledger_data')
    .upsert(
      { user_id: userId, payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('updated_at')
    .single()
  if (error) throw error
  if (data && typeof data === 'object' && 'updated_at' in data) {
    const u = (data as { updated_at: unknown }).updated_at
    if (typeof u === 'string') writeLastIntegratedRemoteAt(userId, u)
  }
}

async function fetchRemoteRow(userId: string): Promise<LedgerRow | null> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase client is not configured.')
  const { data, error } = await sb
    .from('user_ledger_data')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  if (typeof row.updated_at !== 'string') return null
  return { payload: row.payload, updated_at: row.updated_at }
}

/** Apply cloud data only when the server row is newer than what this device last integrated. */
export async function pullRemoteLedgerIfNewer(userId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
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
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase client is not configured.')

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
