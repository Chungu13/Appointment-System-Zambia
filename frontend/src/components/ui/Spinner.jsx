import { classNames } from '../../lib/utils'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <span
      className={classNames(
        'border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block',
        sizes[size],
        className
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  )
}

export function ErrorMessage({ message, className = '' }) {
  return (
    <div
      className={classNames(
        'rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700',
        className
      )}
    >
      {message || 'Something went wrong. Please try again.'}
    </div>
  )
}
