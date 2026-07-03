'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Home, Upload, Brain, BookOpen, Sparkles } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/import', icon: Upload, label: '导入' },
  { href: '/feynman', icon: Brain, label: '费曼' },
  { href: '/daily', icon: BookOpen, label: '总结' },
  { href: '/inspiration', icon: Sparkles, label: '灵感' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show nav on login page or when not authenticated
  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(pathname) || !user) {
    return null
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50" style={{ borderColor: '#F0E6D8' }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 ${
                isActive ? '' : 'text-slate-500'
              }`}
              style={isActive ? { color: '#FF6B8A' } : undefined}
            >
              <item.icon size={18} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
