import { classNames } from '../../lib/utils'

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80',
  secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80',
  outline: 'border border-primary text-primary hover:bg-primary/5',
  ghost: 'text-on-surface-variant hover:bg-surface-container',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  )
}
