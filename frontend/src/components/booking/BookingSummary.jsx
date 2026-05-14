import { CalendarDays, Clock, User, Scissors } from 'lucide-react'
import { formatDateTime, formatZMW } from '../../lib/utils'
import Card from '../ui/Card'

export default function BookingSummary({ service, slot, customer, depositRequired }) {
  return (
    <Card>
      <h3 className="font-semibold text-on-surface mb-4">Booking Summary</h3>
      <div className="space-y-3 text-sm">
        <Row icon={Scissors} label="Service" value={service?.name} />
        <Row icon={User} label="Staff" value={slot?.staff?.fullName} />
        <Row icon={CalendarDays} label="Date & Time" value={slot ? formatDateTime(slot.startsAt) : '—'} />
        <Row icon={Clock} label="Duration" value={service ? `${service.durationMinutes} min` : '—'} />
        {customer?.name && <Row icon={User} label="Name" value={customer.name} />}
        <div className="border-t border-outline-variant pt-3 mt-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Total price</span>
            <span className="font-semibold text-on-surface">{formatZMW(service?.priceZmw)}</span>
          </div>
          {depositRequired > 0 && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Deposit due now</span>
              <span className="font-semibold text-primary">{formatZMW(depositRequired)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-on-surface-variant shrink-0" />
      <span className="text-on-surface-variant w-24 shrink-0">{label}</span>
      <span className="text-on-surface font-medium">{value ?? '—'}</span>
    </div>
  )
}
