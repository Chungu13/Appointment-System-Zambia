import Card from '../ui/Card'
import { classNames } from '../../lib/utils'

export default function StatsCard({ icon: Icon, label, value, sub, color = 'primary', loading }) {
  const colors = {
    primary: 'bg-primary-container text-primary',
    green:   'bg-secondary-container text-secondary',
    yellow:  'bg-yellow-100 text-yellow-700',
    red:     'bg-red-100 text-red-600',
    blue:    'bg-blue-100 text-blue-700',
  }
  return (
    <Card className="flex items-center gap-4">
      <span className={classNames('p-3 rounded-xl shrink-0', colors[color])}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        {loading ? (
          <div className="h-7 w-16 bg-surface-container animate-pulse rounded mb-1" />
        ) : (
          <p className="text-2xl font-bold text-on-surface">{value ?? '-'}</p>
        )}
        <p className="text-sm text-on-surface-variant truncate">{label}</p>
        {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
      </div>
    </Card>
  )
}
