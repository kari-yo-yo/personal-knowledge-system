import type { Metadata, Viewport } from 'next'
import './globals.css'
import { MobileNav } from '@/components/layout/MobileNav'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { StarBackground } from '@/components/theme/StarBackground'

export const metadata: Metadata = {
  title: '个人成长知识管理系统',
  description: '树状层级知识管理，支持网络关联和AI助手',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '知识系统',
  },
}

export const viewport: Viewport = {
  themeColor: '#050510',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <meta name="theme-color" content="#050510" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="知识系统" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="pb-16 lg:pb-0">
        <ThemeProvider>
          <StarBackground />
          {children}
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
