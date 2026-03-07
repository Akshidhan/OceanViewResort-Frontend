import { createContext } from 'react'
import type { LoginPayload } from '../types/models.ts'

export type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
