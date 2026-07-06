'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import DailyReview from '@/components/DailyReview'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DailyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header
          className="h-14 border-b flex items-center gap-3 px-4 backdrop-blur-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu size={20} />
          </button>
          <Link
            href="/"
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>每日总结</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="flex flex-col items-center mb-4">
            <img
              src="/pups/pup-sleep.svg"
              alt="安静写总结的小狗"
              className="puppy-float puppy-dark max-w-[100px] md:max-w-[120px] h-auto"
            />
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              记录今天的点滴，小狗陪你一起成长~
            </p>
          </div>

          <DailyReview />
        </div>
      </main>
    </div>
  )
}
