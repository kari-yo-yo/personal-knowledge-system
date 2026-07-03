'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

const publicPaths = ['/login', '/register']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    if (!user && !publicPaths.includes(pathname)) {
      router.replace('/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#FFF8F0' }}>
        <div className="text-center">
          <img
            src="/pups/pup-sit.svg"
            alt="loading"
            className="w-24 h-24 mx-auto puppy-float"
          />
          <p className="mt-4 text-sm" style={{ color: '#8B7355' }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!user && !publicPaths.includes(pathname)) {
    return null
  }

  return <>{children}</>
}
