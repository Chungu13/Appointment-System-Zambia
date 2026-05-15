import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { ChevronLeft, ChevronRight, X, LayoutGrid, Clock, List } from 'lucide-react'
import { MY_APPOINTMENTS } from '../../graphql/queries/bookings'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { toDateInputValue, formatTime, formatZMW, addDays, classNames } from '../../lib/utils'

// ── Config ───────────────────────────────────────────────────────────────────
const DAY_START = 8
const DAY_END   = 20
const SLOT_H    = 56
const SLOTS     = (DAY_END - DAY_START) * 2

const PALETTES = [
  'bg-emerald-700 border-emerald-900 text-white',
  'bg-teal-600    border-teal-800    text-white',
  'bg-blue-600    border-blue-800    text-white',
  'bg-violet-600  border-violet-800  text-white',
  'bg-amber-600   border-amber-800   text-white',
  'bg-rose-600    border-rose-800    text-white',
  'bg-cyan-600    border-cyan-800    text-white',
]

// Left-border colors for list cards — one per staff, matching PALETTES order
const BORDER_COLORS = [
  'border-l-emerald-600',
  'border-l-teal-500',
  'border-l-blue-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
]

// ── Date helpers ──────────────────────────────────────────────────────────────
function weekStart(date) {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}
function weekDays(start) { return Array.from({ length: 7 }, (_, i) => addDays(start, i)) }
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
function topPx(iso) {
  const d = new Date(iso)
  const mins = d.getHours() * 60 + d.getMinutes() - DAY_START * 60
  return Math.max(0, (mins / 30) * SLOT_H)
}
function heightPx(start, end) {
  const mins = (new Date(end) - new Date(start)) / 60000
  return Math.max(SLOT_H * 0.6, (mins / 30) * SLOT_H)
}

// ── Time ruler ────────────────────────────────────────────────────────────────
function TimeRuler() {
  return (
    <div className="flex flex-col w-14 shrink-0 select-none">
      <div className="h-10" />
      {Array.from({ length: SLOTS }, (_, i) => {
        const mins = DAY_START * 60 + i * 30
        const h = Math.floor(mins / 60)
        const m = mins % 60
        const label = m === 0 ? `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}` : ''
        return (
          <div key={i} className="relative shrink-0" style={{ height: SLOT_H }}>
            {label && (
              <span className="absolute -top-2 right-2 text-[10px] text-on-surface-variant leading-none">
                {label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Day column ────────────────────────────────────────────────────────────────
function DayCol({ day, appointments, colorMap, isToday, onSelect }) {
  const appts = appointments.filter((a) => sameDay(new Date(a.startsAt), day))

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div
        className={classNames(
          'h-10 flex flex-col items-center justify-center rounded-lg mb-px text-xs font-medium leading-none',
          isToday ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
        )}
      >
        <span>{day.toLocaleDateString('en-ZM', { weekday: 'short' })}</span>
        <span className={classNames('text-sm font-bold mt-0.5', isToday ? '' : 'text-on-surface')}>
          {day.getDate()}
        </span>
      </div>

      <div className="relative" style={{ height: SLOTS * SLOT_H }}>
        {Array.from({ length: SLOTS }, (_, i) => (
          <div
            key={i}
            className={classNames(
              'absolute inset-x-0 border-t',
              i % 2 === 0 ? 'border-outline-variant' : 'border-outline-variant/30'
            )}
            style={{ top: i * SLOT_H }}
          />
        ))}

        {appts.map((appt) => {
          const t = topPx(appt.startsAt)
          const h = heightPx(appt.startsAt, appt.endsAt)
          const palette = colorMap[appt.staff.id] ?? PALETTES[0]
          const compact = h < SLOT_H * 1.4

          return (
            <button
              key={appt.id}
              onClick={() => onSelect(appt)}
              title={`${appt.customer.fullName} · ${appt.service.name}`}
              className={classNames(
                'absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-0.5',
                'text-left cursor-pointer transition-opacity hover:opacity-90 overflow-hidden z-10',
                palette
              )}
              style={{ top: t + 1, height: h - 2 }}
            >
              <p className="font-semibold truncate leading-tight" style={{ fontSize: 11 }}>
                {appt.customer.fullName}
              </p>
              {!compact && (
                <>
                  <p className="truncate opacity-80 leading-tight" style={{ fontSize: 10 }}>
                    {appt.service.name}
                  </p>
                  <p className="truncate opacity-70 leading-tight" style={{ fontSize: 10 }}>
                    {appt.staff.fullName}
                  </p>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ days, appointments, borderColorMap, today, onSelect }) {
  return (
    <div className="space-y-6">
      {days.map((day) => {
        const isToday    = sameDay(day, today)
        const isTomorrow = sameDay(day, addDays(today, 1))
        const dayAppts   = appointments
          .filter((a) => sameDay(new Date(a.startsAt), day))
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))

        const label = isToday
          ? 'Today'
          : isTomorrow
          ? 'Tomorrow'
          : day.toLocaleDateString('en-ZM', { weekday: 'long' })

        const sublabel = day.toLocaleDateString('en-ZM', { day: 'numeric', month: 'long' })

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div className="flex items-baseline gap-2 mb-3">
              <h3 className={classNames(
                'text-sm font-bold uppercase tracking-wide',
                isToday ? 'text-primary' : 'text-on-surface'
              )}>
                {label}
              </h3>
              <span className="text-xs text-on-surface-variant">{sublabel}</span>
              {dayAppts.length > 0 && (
                <span className="text-xs text-on-surface-variant ml-auto">
                  {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {dayAppts.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 py-2 pl-4 border-l-2 border-outline-variant/40 italic">
                No appointments
              </p>
            ) : (
              <div className="space-y-2">
                {dayAppts.map((appt) => {
                  const borderCls = borderColorMap[appt.staff.id] ?? 'border-l-gray-400'
                  return (
                    <button
                      key={appt.id}
                      onClick={() => onSelect(appt)}
                      className={classNames(
                        'w-full text-left rounded-xl border border-outline-variant',
                        'bg-surface-container-lowest hover:bg-surface-container',
                        'transition-colors pl-4 pr-4 py-3 border-l-4',
                        borderCls
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary font-display">
                              {formatTime(appt.startsAt)}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              {appt.service.durationMinutes} min
                            </span>
                          </div>
                          <p className="font-semibold text-on-surface leading-snug">
                            {appt.customer.fullName}
                          </p>
                          <p className="text-sm text-on-surface-variant truncate">
                            {appt.service.name}
                            <span className="mx-1.5">·</span>
                            {appt.staff.fullName}
                          </p>
                        </div>
                        <Badge status={appt.status} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Appointment modal ─────────────────────────────────────────────────────────
function ApptModal({ appt, onClose, onAction, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Appointment</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-on-surface">{appt.customer.fullName}</p>
              <p className="text-sm text-on-surface-variant">{appt.customer.phone}</p>
            </div>
            <Badge status={appt.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-on-surface-variant">Service</p>
              <p className="font-medium text-on-surface">{appt.service.name}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Staff</p>
              <p className="font-medium text-on-surface">{appt.staff.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Time</p>
              <p className="font-medium text-on-surface">{formatTime(appt.startsAt)}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Duration</p>
              <p className="font-medium text-on-surface">{appt.service.durationMinutes} min</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Price</p>
              <p className="font-medium text-on-surface">{formatZMW(appt.service.priceZmw)}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Booked by</p>
              <p className="font-medium text-on-surface capitalize">{appt.bookedBy}</p>
            </div>
          </div>

          {appt.customerNotes && (
            <div className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface-variant">
              {appt.customerNotes}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {appt.status === 'confirmed' && (
              <Button size="sm" loading={loading} onClick={() => onAction(appt.id, 'IN_PROGRESS')}>
                Start
              </Button>
            )}
            {appt.status === 'in_progress' && (
              <Button size="sm" loading={loading} onClick={() => onAction(appt.id, 'COMPLETED')}>
                Mark complete
              </Button>
            )}
            {appt.status === 'pending' && (
              <Button size="sm" loading={loading} onClick={() => onAction(appt.id, 'CONFIRMED')}>
                Confirm
              </Button>
            )}
            {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
              <Button size="sm" variant="danger" loading={loading} onClick={() => onAction(appt.id, 'CANCELLED')}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const VIEW_OPTIONS = [
  { key: 'week', icon: LayoutGrid, label: 'Week' },
  { key: 'day',  icon: Clock,      label: 'Day'  },
  { key: 'list', icon: List,       label: 'List' },
]

const STORED_VIEW_KEY = 'bb_calendar_view'

function getInitialView() {
  const stored = localStorage.getItem(STORED_VIEW_KEY)
  if (stored && VIEW_OPTIONS.some((v) => v.key === stored)) return stored
  return window.innerWidth < 640 ? 'day' : 'week'
}

export default function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [wkStart, setWkStart] = useState(() => weekStart(today))
  const [view, _setView]      = useState(getInitialView)
  const [selDay, setSelDay]   = useState(today)
  const [selAppt, setSelAppt] = useState(null)

  function setView(v) {
    _setView(v)
    localStorage.setItem(STORED_VIEW_KEY, v)
  }

  const days = useMemo(() => weekDays(wkStart), [wkStart])
  const dateFrom = toDateInputValue(days[0])
  const dateTo   = toDateInputValue(days[6])

  const { data, loading, error, refetch } = useQuery(MY_APPOINTMENTS, {
    variables: { dateFrom, dateTo },
    fetchPolicy: 'network-only',
  })

  const [updateStatus, { loading: acting }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => { refetch(); setSelAppt(null) },
  })

  const appointments = data?.myAppointments ?? []

  // Staff → palette/border color maps (stable per week's data)
  const { colorMap, borderColorMap } = useMemo(() => {
    const ids = [...new Set(appointments.map((a) => a.staff.id))]
    return {
      colorMap:       Object.fromEntries(ids.map((id, i) => [id, PALETTES[i % PALETTES.length]])),
      borderColorMap: Object.fromEntries(ids.map((id, i) => [id, BORDER_COLORS[i % BORDER_COLORS.length]])),
    }
  }, [appointments])

  const displayDays  = view === 'week' ? days : [selDay]
  const rangeLabel   = `${days[0].toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-ZM', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <PageWrapper maxWidth="full">
      {/* ── Toolbar ── */}
      <PageHeader
        title="Calendar"
        subtitle={rangeLabel}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Week / Day / List toggle */}
            <div className="flex rounded-xl overflow-hidden border border-outline-variant text-sm">
              {VIEW_OPTIONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  title={label}
                  className={classNames(
                    'px-3 py-1.5 font-medium flex items-center gap-1.5 transition-colors',
                    view === key
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setWkStart((d) => addDays(d, -7))}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setWkStart((d) => addDays(d, 7))}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Jump-to date */}
            <input
              type="date"
              value={toDateInputValue(wkStart)}
              onChange={(e) => {
                const d = new Date(e.target.value + 'T00:00:00')
                setWkStart(weekStart(d))
                setSelDay(d)
              }}
              className="rounded-xl border border-outline-variant px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        }
      />

      {/* ── Day pills (day view only) ── */}
      {view === 'day' && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {days.map((d) => {
            const active  = sameDay(d, selDay)
            const isToday = sameDay(d, today)
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelDay(d)}
                className={classNames(
                  'flex flex-col items-center px-3 py-2 rounded-xl shrink-0 transition-colors',
                  active
                    ? 'bg-primary text-on-primary'
                    : isToday
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                )}
              >
                <span className="text-xs font-medium">
                  {d.toLocaleDateString('en-ZM', { weekday: 'short' })}
                </span>
                <span className="text-base font-bold">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {/* ── List view ── */}
      {view === 'list' && !loading && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
          <ListView
            days={days}
            appointments={appointments}
            borderColorMap={borderColorMap}
            today={today}
            onSelect={setSelAppt}
          />
        </div>
      )}

      {/* ── Grid (week / day) ── */}
      {view !== 'list' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-auto">
          <div className="flex" style={{ minWidth: view === 'week' ? 620 : 0 }}>
            <TimeRuler />
            <div className="flex flex-1 gap-px px-0.5 pb-4">
              {displayDays.map((d) => (
                <DayCol
                  key={d.toISOString()}
                  day={d}
                  appointments={appointments}
                  colorMap={colorMap}
                  isToday={sameDay(d, today)}
                  onSelect={setSelAppt}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Staff legend (grid views only) ── */}
      {view !== 'list' && appointments.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {[...new Set(appointments.map((a) => a.staff.id))].map((id) => {
            const staff = appointments.find((a) => a.staff.id === id)?.staff
            const bg = (colorMap[id] ?? '').split(' ')[0]
            return (
              <div key={id} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className={classNames('w-3 h-3 rounded-sm inline-block', bg)} />
                {staff?.fullName}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {selAppt && (
        <ApptModal
          appt={selAppt}
          loading={acting}
          onClose={() => setSelAppt(null)}
          onAction={(id, status) => updateStatus({ variables: { appointmentId: id, status } })}
        />
      )}
    </PageWrapper>
  )
}
