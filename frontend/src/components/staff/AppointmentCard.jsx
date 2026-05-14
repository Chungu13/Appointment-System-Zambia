import { Clock, User, Phone } from 'lucide-react'
import { formatTime, formatZMW, classNames } from '../../lib/utils'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

const NEXT_STATUS = {
  confirmed:   { label: 'Start',    next: 'IN_PROGRESS' },
  in_progress: { label: 'Complete', next: 'COMPLETED' },
}

export default function AppointmentCard({ appointment, onStatusChange, loading }) {
  const { customer, service, staff, status, startsAt, endsAt, payments } = appointment
  const transition = NEXT_STATUS[status]
  const hasPaid = payments?.some((p) => p.status === 'completed')

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar name={customer.fullName} size="sm" />
          <div>
            <p className="font-medium text-on-surface text-sm">{customer.fullName}</p>
            <p className="text-xs text-on-surface-variant flex items-center gap-1">
              <Phone size={10} />{customer.phone}
            </p>
          </div>
        </div>
        <Badge status={status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1"><Clock size={11} />{formatTime(startsAt)} – {formatTime(endsAt)}</span>
        <span className="flex items-center gap-1"><User size={11} />{staff.fullName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface">{service.name}</p>
          <p className={classNames('text-xs', hasPaid ? 'text-secondary' : 'text-yellow-700')}>
            {hasPaid ? `Paid ${formatZMW(service.depositZmw)}` : 'Deposit pending'}
          </p>
        </div>
        {transition && (
          <Button
            size="sm"
            variant={transition.next === 'COMPLETED' ? 'primary' : 'secondary'}
            loading={loading}
            onClick={() => onStatusChange(appointment.id, transition.next)}
          >
            {transition.label}
          </Button>
        )}
      </div>
    </div>
  )
}
