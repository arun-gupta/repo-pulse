'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export interface AuthSession {
  token: string
  username: string
}

interface AuthContextValue {
  session: AuthSession | null
  signIn: (session: AuthSession) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  signIn: () => {},
  signOut: () => {},
})

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: React.ReactNode
  initialSession?: AuthSession | null
}) {
  const [session, setSession] = useState<AuthSession | null>(initialSession)

  const signIn = useCallback((newSession: AuthSession) => {
    setSession(newSession)
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
  }, [])

  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
