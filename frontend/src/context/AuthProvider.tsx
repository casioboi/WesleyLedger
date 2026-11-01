import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Network } from '@capacitor/network'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'
import { app, firebaseConfigured } from '../firebase'
import { AuthContext, type UserSession } from './authContext'

const OFFLINE_SESSION_KEY = 'wesleyledger_offline_session'

function toUserSession(user: User | null): UserSession | null {
  if (!user) return null
  return {
    user: {
      id: user.uid,
      email: user.email ?? undefined,
    },
  }
}

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) return maybeMessage
  }
  return 'Authentication failed. Please try again.'
}

function configurationError(action: string) {
  return new Error(`${action} is not configured for this build.`)
}

const pendingAccountRecords = new Map<string, Promise<void>>()

function ensureAccountRecord(user: User): Promise<void> {
  if (!app) return Promise.resolve()
  const pending = pendingAccountRecords.get(user.uid)
  if (pending) return pending

  const write = (async () => {
    const db = getFirestore(app)
    const accountRef = doc(db, 'users_metadata', user.uid)
    const accountSnap = await getDoc(accountRef)
    if (accountSnap.exists()) return
    await setDoc(accountRef, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'WesleyLedger user',
      createdAt: new Date().toISOString(),
    })
  })()
  pendingAccountRecords.set(user.uid, write)
  return write.finally(() => pendingAccountRecords.delete(user.uid))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!app) {
      setLoading(false)
      return
    }

    const auth = getAuth(app)

    const initOffline = async () => {
      const status = await Network.getStatus()
      const cached = localStorage.getItem(OFFLINE_SESSION_KEY)
      if (!status.connected && cached) {
        try {
          setSession(JSON.parse(cached) as UserSession)
        } catch {
          setSession(null)
        }
      }
      setLoading(false)
    }

    initOffline()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentSession = toUserSession(user)
      if (currentSession && user) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
        setSession(currentSession)
        void ensureAccountRecord(user).catch((error) => {
          console.error('Could not create account record for admin management:', error)
        })
      } else {
        Network.getStatus().then((status) => {
          if (status.connected) {
            localStorage.removeItem(OFFLINE_SESSION_KEY)
            setSession(null)
          }
        })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!app) return { error: configurationError('Cloud sign-in'), session: null }

    try {
      const auth = getAuth(app)
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      await ensureAccountRecord(userCredential.user)
      const currentSession = toUserSession(userCredential.user)
      if (currentSession) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
      }
      return { error: null, session: currentSession }
    } catch (error) {
      return { error: new Error(authErrorMessage(error)), session: null }
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!app) return { error: configurationError('Cloud sign-up'), session: null }

    try {
      const auth = getAuth(app)
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await ensureAccountRecord(userCredential.user)
      const currentSession = toUserSession(userCredential.user)
      if (currentSession) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
      }
      return { error: null, session: currentSession }
    } catch (error) {
      return { error: new Error(authErrorMessage(error)), session: null }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!app) return

    const auth = getAuth(app)
    localStorage.removeItem(OFFLINE_SESSION_KEY)
    await firebaseSignOut(auth)
    setSession(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!app) return { error: configurationError('Password reset') }

    try {
      const auth = getAuth(app)
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/auth/reset-password`,
      })
      return { error: null }
    } catch (error) {
      return { error: new Error(authErrorMessage(error)) }
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      configured: firebaseConfigured,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      resetPassword,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signOut, resetPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
