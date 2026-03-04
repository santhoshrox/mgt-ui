import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { fetchUser, clearCache, type GHUser } from '../lib/github'

const TOKEN_KEY = 'mgt_gh_token'

interface AuthContextType {
  token: string | null
  user: GHUser | null
  loading: boolean
  error: string | null
  login: (token: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<GHUser | null>(null)
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async (t: string) => {
    try {
      setLoading(true)
      setError(null)
      const u = await fetchUser(t)
      setUser(u)
      setToken(t)
      localStorage.setItem(TOKEN_KEY, t)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg === 'UNAUTHORIZED') {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setError('Invalid or expired token')
      } else {
        setError(msg)
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      loadUser(stored)
    }
  }, [loadUser])

  const login = useCallback(async (t: string) => {
    return loadUser(t)
  }, [loadUser])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setError(null)
    clearCache()
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
