import { classNames } from '../../lib/utils'

const colors = {
  green:  'bg-secondary-container text-on-secondary-container',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-700',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-surface-container text-on-surface-variant',
  purple: 'bg-purple-100 text-purple-800',
  primary: 'bg-primary-container text-on-primary-container',
}

const statusMap = {
  pending:     'yellow',
  confirmed:   'blue',
  in_progress: 'purple',
  completed:   'green',
  cancelled:   'red',
  no_show:     'gray',
  open:        'green',
  closed:      'gray',
}

export default function Badge({ color, status, className = '', children }) {
  const resolvedColor = color ?? statusMap[status] ?? 'gray'
  return (
    <span
      className={classNames(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
        colors[resolvedColor],
        className
      )}
    >
      {children ?? status}
    </span>
  )
}
