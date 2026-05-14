import { classNames } from '../../lib/utils'

export default function Card({ className = '', children, padding = true, ...props }) {
  return (
    <div
      className={classNames(
        'bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm',
        padding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return (
    <div className={classNames('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }) {
  return (
    <h2 className={classNames('font-semibold text-on-surface', className)}>{children}</h2>
  )
}
