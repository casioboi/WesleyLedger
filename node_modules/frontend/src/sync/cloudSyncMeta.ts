const KEY = 'wesleyLedger.cloudSyncMeta.v1'

type Stored = {
  byUser: Record<string, { lastIntegratedRemoteAt: string }>
}

function readAll(): Stored {
  if (typeof window === 'undefined') return { byUser: {} }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { byUser: {} }
    const j = JSON.parse(raw) as unknown
    if (!j || typeof j !== 'object' || Array.isArray(j)) return { byUser: {} }
    const o = j as Record<string, unknown>
    const byUser: Stored['byUser'] = {}
    if (o.byUser && typeof o.byUser === 'object' && !Array.isArray(o.byUser)) {
      for (const [k, v] of Object.entries(o.byUser)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const at = (v as Record<string, unknown>).lastIntegratedRemoteAt
          if (typeof at === 'string') byUser[k] = { lastIntegratedRemoteAt: at }
        }
      }
    }
    return { byUser }
  } catch {
    return { byUser: {} }
  }
}

function writeAll(s: Stored) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function readLastIntegratedRemoteAt(userId: string): string | null {
  return readAll().byUser[userId]?.lastIntegratedRemoteAt ?? null
}

export function writeLastIntegratedRemoteAt(userId: string, iso: string) {
  const s = readAll()
  s.byUser[userId] = { lastIntegratedRemoteAt: iso }
  writeAll(s)
}
