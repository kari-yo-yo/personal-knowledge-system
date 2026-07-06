interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 48, className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`galaxy-loader ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
