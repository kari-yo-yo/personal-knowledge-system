import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MobileNav } from '@/components/layout/MobileNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '个人成长知识管理系统',
  description: '树状层级知识管理，支持网络关联和AI助手',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} pb-16 lg:pb-0`}>
        {children}
        <MobileNav />
      </body>
    </html>
  )
}
