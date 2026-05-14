import { Clock, ChevronRight } from 'lucide-react'
import { formatZMW } from '../../lib/utils'
import Badge from '../ui/Badge'

const CATEGORY_COLORS = {
  hair: 'primary', nails: 'green', braids: 'yellow', colour: 'purple', lashes: 'blue', other: 'gray',
}

export default function ServiceCard({ service, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        selected
          ? 'border-primary bg-primary-container/40 ring-2 ring-primary/20'
          : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-on-surface text-sm">{service.name}</span>
            <Badge color={CATEGORY_COLORS[service.category?.toLowerCase()] ?? 'gray'}>
              {service.category}
            </Badge>
          </div>
          {service.description && (
            <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">{service.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><Clock size={11} />{service.durationMinutes} min</span>
            <span className="font-semibold text-on-surface">{formatZMW(service.priceZmw)}</span>
            {service.depositZmw > 0 && (
              <span className="text-on-surface-variant">Deposit: {formatZMW(service.depositZmw)}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
      </div>
    </button>
  )
}
