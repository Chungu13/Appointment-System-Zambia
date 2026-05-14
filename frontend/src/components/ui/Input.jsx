import { classNames } from '../../lib/utils'

export default function Input({
  label,
  error,
  hint,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-on-surface-variant">{label}</label>
      )}
      <input
        className={classNames(
          'w-full rounded-xl border px-3 py-2.5 text-sm text-on-surface bg-surface-container-lowest placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
          error ? 'border-red-400' : 'border-outline-variant',
          inputClassName
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-on-surface-variant">{label}</label>
      )}
      <textarea
        rows={3}
        className={classNames(
          'w-full rounded-xl border px-3 py-2.5 text-sm text-on-surface bg-surface-container-lowest placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none',
          error ? 'border-red-400' : 'border-outline-variant'
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  )
}
