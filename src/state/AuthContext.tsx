import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest } from '../lib/http.ts'
import type { LoginPayload, LoginResult } from '../types/models.ts'
import { AuthContext, type AuthContextValue } from './auth-context.ts'

const AUTH_TOKEN_KEY = 'ovr.auth.token'
const AUTH_SESSION_KEY = 'ovr.auth.session'

function getInitialToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

function getInitialSession(): boolean {
  return localStorage.getItem(AUTH_SESSION_KEY) === 'true'
}

function extractToken(result: unknown): string | null {
  if (typeof result !== 'object' || result === null) {
    return null
  }

  const maybeRecord = result as Record<string, unknown>
  const candidates = [
    maybeRecord.token,
    maybeRecord.accessToken,
    maybeRecord.jwt,
    typeof maybeRecord.data === 'object' && maybeRecord.data !== null
      ? (maybeRecord.data as Record<string, unknown>).token
      : null,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getInitialToken())
  const [sessionFlag, setSessionFlag] = useState<boolean>(() => getInitialSession())

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await apiRequest<LoginResult | Record<string, unknown>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const resolvedToken = extractToken(result)

    if (resolvedToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, resolvedToken)
      setToken(resolvedToken)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setToken(null)
    }

    localStorage.setItem(AUTH_SESSION_KEY, 'true')
    setSessionFlag(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_SESSION_KEY)
    setToken(null)
    setSessionFlag(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: sessionFlag,
      login,
      logout,
    }),
    [login, logout, sessionFlag, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
