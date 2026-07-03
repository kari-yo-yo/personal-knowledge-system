'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
  login: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
  login: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
      })
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initDone = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_token', token)
    }
    // Restore cookie from token
    try {
      await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    } catch {
      // ignore
    }
    // Refresh user state
    const res = await fetch('/api/auth/me')
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    registerServiceWorker()

    const init = async () => {
      setLoading(true)

      // Step 1: Try cookie-based auth
      try {
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const data = await meRes.json()
          setUser(data.user)
          setLoading(false)
          return
        }
      } catch {
        // network error, continue
      }

      // Step 2: Cookie failed, try localStorage token
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('session_token')
        if (token) {
          try {
            // Restore cookie
            const restoreRes = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            })

            if (restoreRes.ok) {
              // Cookie restored, now check auth
              const meRes = await fetch('/api/auth/me')
              if (meRes.ok) {
                const data = await meRes.json()
                setUser(data.user)
                setLoading(false)
                return
              }
            }
          } catch {
            // restore failed
          }
          // Token is stale, clear it
          localStorage.removeItem('session_token')
        }
      }

      setLoading(false)
    }

    init()
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token')
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh, login }}>
      {children}
    </AuthContext.Provider>
  )
}
