import { createContext } from 'react'
export type UserSession = {
  user: {
    id: string
    email?: string
  }
}

export type AuthContextValue = {
  session: UserSession | null
  loading: boolean
  configured: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; session?: UserSession | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; session?: UserSession | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
