import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextValue = {
  session: Session | null
  loading: boolean
  configured: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; session?: Session | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; session?: Session | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
