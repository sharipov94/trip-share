import { createContext, useContext } from 'react'

export type User = { id: string; firstName?: string | null; avatarUrl?: string | null; paymentDetails?: string | null }
export type AuthState = { ready: boolean; user: User | null; refresh: () => Promise<void> }

export const AuthCtx = createContext<AuthState>({ ready: false, user: null, refresh: async () => {} })

export const useAuth = () => useContext(AuthCtx)
