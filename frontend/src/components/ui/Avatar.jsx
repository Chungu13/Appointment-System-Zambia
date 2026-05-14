import { classNames, getInitials } from '../../lib/utils'

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={classNames('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={classNames(
        'rounded-full bg-primary-container text-on-primary-container font-semibold flex items-center justify-center shrink-0',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
