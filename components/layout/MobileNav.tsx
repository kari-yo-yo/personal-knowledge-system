'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderTop: '1px solid var(--glass-border)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-all duration-200 ${
                isActive ? '' : 'opacity-50'
              }`}
              style={
                isActive
                  ? {
                      color: 'var(--accent-aurora)',
                      textShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                    }
                  : { color: 'var(--text-muted)' }
              }
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
