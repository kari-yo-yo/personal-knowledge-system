import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function GlassCard({ children, className = '', hover = true, onClick, style }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${hover ? '' : 'hover:!transform-none hover:!shadow-none'} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  )
}
