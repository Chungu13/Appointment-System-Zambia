import { formatTime } from '../../lib/utils'
import { classNames } from '../../lib/utils'
import Avatar from '../ui/Avatar'

export default function TimeSlotGrid({ slots, selected, onSelect }) {
  if (!slots.length) {
    return (
      <p className="text-sm text-on-surface-variant text-center py-8">
        No available slots for this date. Try another day.
      </p>
    )
  }

  // Group by staff
  const byStaff = slots.reduce((acc, slot) => {
    const key = slot.staff.id
    if (!acc[key]) acc[key] = { staff: slot.staff, slots: [] }
    acc[key].slots.push(slot)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.values(byStaff).map(({ staff, slots: staffSlots }) => (
        <div key={staff.id}>
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={staff.fullName} src={staff.avatarUrl} size="sm" />
            <span className="text-sm font-medium text-on-surface">{staff.fullName}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {staffSlots.map((slot) => {
              const isSelected =
                selected?.startsAt === slot.startsAt && selected?.staff?.id === staff.id
              return (
                <button
                  key={slot.startsAt}
                  onClick={() => onSelect(slot)}
                  className={classNames(
                    'py-2 px-2 rounded-xl text-sm font-medium transition-all border',
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/60 hover:bg-primary-container/20'
                  )}
                >
                  {formatTime(slot.startsAt)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
