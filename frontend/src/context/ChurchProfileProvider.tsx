import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { ChurchProfileContext } from './churchProfileContext'
import {
  type ChurchProfile,
  isProfileComplete,
} from '../lib/churchProfileModel'

const STORAGE_KEY = 'wesleyLedger.churchProfile.v1'

function emptyProfile(): ChurchProfile {
  return {
    society: '',
    circuit: '',
    diocese: '',
    updatedAt: '',
  }
}

/** Stable empty profile when nothing is stored yet (avoids new object each render). */
const EMPTY_PROFILE = emptyProfile()

function loadFromStorage(): ChurchProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ChurchProfile>
    if (
      typeof parsed.society === 'string' &&
      typeof parsed.circuit === 'string' &&
      typeof parsed.diocese === 'string'
    ) {
      return {
        society: parsed.society,
        circuit: parsed.circuit,
        diocese: parsed.diocese,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

let cached: ChurchProfile | null = loadFromStorage()
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** For cloud sync: re-subscribe when profile changes. */
export function subscribeChurchProfileStore(cb: () => void) {
  return subscribe(cb)
}

function getSnapshot(): ChurchProfile | null {
  return cached
}

function getServerSnapshot(): ChurchProfile | null {
  return null
}

function persist(profile: ChurchProfile) {
  cached = profile
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    /* quota or private mode */
  }
  listeners.forEach((l) => l())
}

/** Replace stored profile (e.g. after downloading from cloud). */
export function applyChurchProfileFromSync(profile: ChurchProfile) {
  persist(profile)
}

export function getChurchProfileStorageSnapshot(): ChurchProfile | null {
  return cached
}

export function ChurchProfileProvider({ children }: { children: ReactNode }) {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const data = profile ?? EMPTY_PROFILE

  const isComplete = useMemo(() => isProfileComplete(profile), [profile])

  const saveProfile = useCallback((next: Omit<ChurchProfile, 'updatedAt'>) => {
    const updated: ChurchProfile = {
      society: next.society.trim(),
      circuit: next.circuit.trim(),
      diocese: next.diocese.trim(),
      updatedAt: new Date().toISOString(),
    }
    persist(updated)
  }, [])

  const value = useMemo(
    () => ({
      profile: data,
      isComplete,
      saveProfile,
    }),
    [data, isComplete, saveProfile]
  )

  return (
    <ChurchProfileContext.Provider value={value}>
      {children}
    </ChurchProfileContext.Provider>
  )
}
