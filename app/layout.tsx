import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MobileNav } from '@/components/layout/MobileNav'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '个人成长知识管理系统',
  description: '树状层级知识管理，支持网络关联和AI助手',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '知识系统',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF6B8A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B8A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="知识系统" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} pb-16 lg:pb-0`}>
        <AuthProvider>
          <AuthGuard>
            {children}
            <MobileNav />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
