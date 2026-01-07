interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
