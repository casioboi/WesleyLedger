import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }
    let cancelled = false
    sb.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session)
        setLoading(false)
      }
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: new Error('Cloud sync is not configured.'), session: null }
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    return { error: error ? new Error(error.message) : null, session: data.session ?? null }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: new Error('Cloud sync is not configured.'), session: null }
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password })
    return { error: error ? new Error(error.message) : null, session: data.session ?? null }
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured(),
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
