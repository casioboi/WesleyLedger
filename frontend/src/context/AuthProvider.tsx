import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Network } from '@capacitor/network'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth'
import { app } from '../firebase'
import { AuthContext, type UserSession } from './authContext'

const OFFLINE_SESSION_KEY = 'wesleyledger_offline_session'

// Helper to convert Firebase User to our UserSession format
const toUserSession = (user: User | null): UserSession | null => {
  if (!user) return null
  return {
    user: {
      id: user.uid,
      email: user.email ?? undefined
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(app)
    if (!auth) {
      setLoading(false)
      return
    }

    // Try to load offline session first for fast UI startup
    const initOffline = async () => {
      const status = await Network.getStatus()
      const cached = localStorage.getItem(OFFLINE_SESSION_KEY)
      if (!status.connected && cached) {
        try {
          setSession(JSON.parse(cached))
        } catch (e) {
          setSession(null)
        }
      }
      setLoading(false)
    }
    
    initOffline()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentSession = toUserSession(user)
      if (currentSession) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
        setSession(currentSession)
      } else {
        Network.getStatus().then(status => {
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
    try {
      const auth = getAuth(app)
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const currentSession = toUserSession(userCredential.user)
      if (currentSession) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
      }
      return { error: null, session: currentSession }
    } catch (e: any) {
      return { error: new Error(e.message), session: null }
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const auth = getAuth(app)
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const currentSession = toUserSession(userCredential.user)
      if (currentSession) {
        localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(currentSession))
      }
      return { error: null, session: currentSession }
    } catch (e: any) {
      return { error: new Error(e.message), session: null }
    }
  }, [])

  const signOut = useCallback(async () => {
    const auth = getAuth(app)
    localStorage.removeItem(OFFLINE_SESSION_KEY)
    await firebaseSignOut(auth)
    setSession(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const auth = getAuth(app)
      // Note: Firebase sends a predefined email template. You can configure the reset URL in the Firebase Console.
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/auth/reset-password`
      })
      return { error: null }
    } catch (e: any) {
      return { error: new Error(e.message) }
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      configured: true, // Firebase is configured if this runs
      signInWithEmail,
      signUpWithEmail,
      signOut,
      resetPassword,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signOut, resetPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
