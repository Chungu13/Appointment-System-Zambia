import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { classNames, toDateInputValue, addDays } from '../../lib/utils'

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ selected, onChange, minDate }) {
  const today = new Date()
  const min = minDate ? new Date(minDate) : today
  const initial = selected ? new Date(selected) : today

  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )

  function selectDay(day) {
    const d = new Date(viewYear, viewMonth, day)
    if (d < min) return
    const yyyy = viewYear
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${yyyy}-${mm}-${dd}`)
  }

  function isSelected(day) {
    if (!selected || !day) return false
    const d = new Date(viewYear, viewMonth, day)
    return toDateInputValue(d) === selected
  }

  function isPast(day) {
    if (!day) return false
    const d = new Date(viewYear, viewMonth, day)
    d.setHours(0,0,0,0)
    const m = new Date(min)
    m.setHours(0,0,0,0)
    return d < m
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium text-on-surface text-sm">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-on-surface-variant py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day && (
              <button
                onClick={() => selectDay(day)}
                disabled={isPast(day)}
                className={classNames(
                  'w-8 h-8 rounded-full text-sm transition-colors',
                  isSelected(day)
                    ? 'bg-primary text-on-primary font-medium'
                    : isPast(day)
                    ? 'text-outline-variant cursor-not-allowed'
                    : 'text-on-surface hover:bg-primary-container/50'
                )}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
