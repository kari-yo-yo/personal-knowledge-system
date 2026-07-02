'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Network, Sparkles } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/network', icon: Network, label: '网络' },
  { href: '/inspiration', icon: Sparkles, label: '灵感' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
