import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { ChevronLeft, ChevronRight, X, LayoutGrid, Clock, List } from 'lucide-react'
import { MY_APPOINTMENTS, AVAILABILITY } from '../../graphql/queries/bookings'
import { UPDATE_APPOINTMENT_STATUS, REBOOK_APPOINTMENT } from '../../graphql/mutations/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { toDateInputValue, formatTime, formatZMW, addDays, classNames } from '../../lib/utils'

// ── Config ───────────────────────────────────────────────────────────────────
const BURG       = '#3B2A1E'
const MUTED      = '#5C4C3D'
const HINT       = '#8A7A6A'
const BORDER     = '#EDE3D6'
const TEXT       = '#241812'
const NAV_MUTED  = '#5C4C3D'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

const DAY_START = 8
const DAY_END   = 20
const SLOT_H    = 56
const SLOTS     = (DAY_END - DAY_START) * 2

// Staff palette — solid backgrounds for calendar blocks
const PALETTES = [
  { bg: '#3B2A1E', border: '#241812', text: '#fff' },
  { bg: '#2D6A4F', border: '#1B4332', text: '#fff' },
  { bg: '#1D4E89', border: '#0D2E57', text: '#fff' },
  { bg: '#7B5E2A', border: '#5A3E15', text: '#fff' },
  { bg: '#5C3D6E', border: '#3B2248', text: '#fff' },
  { bg: '#B5451B', border: '#7A2E0D', text: '#fff' },
  { bg: '#1A6B6B', border: '#0D4040', text: '#fff' },
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

// ── Status label (plain text, no badge pill) ──────────────────────────────────
const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed',
  completed: 'Done', cancelled: 'Cancelled', no_show: 'No show',
  expired: 'Expired',
}

// ── Time ruler ────────────────────────────────────────────────────────────────
function TimeRuler() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 48, flexShrink: 0, userSelect: 'none' }}>
      <div style={{ height: 40 }} />
      {Array.from({ length: SLOTS }, (_, i) => {
        const mins = DAY_START * 60 + i * 30
        const h = Math.floor(mins / 60)
        const m = mins % 60
        const label = m === 0 ? `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}` : ''
        return (
          <div key={i} style={{ position: 'relative', flexShrink: 0, height: SLOT_H }}>
            {label && (
              <span style={{ position: 'absolute', top: -7, right: 6, fontSize: 10, fontFamily: sans, fontWeight: 300, color: MUTED, lineHeight: 1 }}>
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
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', marginBottom: 1,
        backgroundColor: isToday ? BURG : 'transparent',
        color: isToday ? '#fff' : MUTED,
        fontSize: 11, fontFamily: sans, fontWeight: 300, lineHeight: 1,
      }}>
        <span>{day.toLocaleDateString('en-ZM', { weekday: 'short' })}</span>
        <span style={{ fontSize: 14, fontWeight: 400, marginTop: 2, color: isToday ? '#fff' : TEXT }}>
          {day.getDate()}
        </span>
      </div>

      <div style={{ position: 'relative', height: SLOTS * SLOT_H }}>
        {Array.from({ length: SLOTS }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: 0, right: 0,
              borderTop: `0.5px solid ${i % 2 === 0 ? BORDER : BORDER + '80'}`,
              top: i * SLOT_H,
            }}
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
              style={{
                position: 'absolute', left: 2, right: 2, top: t + 1, height: h - 2,
                backgroundColor: palette.bg,
                borderLeft: `3px solid ${palette.border}`,
                borderRadius: 0, padding: '3px 6px',
                textAlign: 'left', cursor: 'pointer', overflow: 'hidden',
                zIndex: 10, border: 'none', transition: 'opacity 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <p style={{ fontSize: 11, fontFamily: sans, fontWeight: 400, color: palette.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {appt.customer.fullName}
              </p>
              {!compact && (
                <>
                  <p style={{ fontSize: 10, fontFamily: sans, fontWeight: 300, color: palette.text, opacity: 0.8, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {appt.service.name}
                  </p>
                  <p style={{ fontSize: 10, fontFamily: sans, fontWeight: 300, color: palette.text, opacity: 0.7, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
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
function ListView({ days, appointments, today, onSelect, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {days.map((day, di) => {
        const isToday    = sameDay(day, today)
        const isTomorrow = sameDay(day, addDays(today, 1))
        const dayAppts   = appointments
          .filter((a) => sameDay(new Date(a.startsAt), day))
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))

        const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : day.toLocaleDateString('en-ZM', { weekday: 'long' })
        const sublabel = day.toLocaleDateString('en-ZM', { day: 'numeric', month: 'long' })

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '12px 20px',
              borderBottom: `0.5px solid ${BORDER}`,
              backgroundColor: isToday ? '#FBF7F1' : '#FBF7F1',
            }}>
              <h3 style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', color: isToday ? BURG : TEXT, margin: 0 }}>
                {label}
              </h3>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED }}>{sublabel}</span>
              {dayAppts.length > 0 && (
                <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, marginLeft: 'auto' }}>
                  {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {dayAppts.length === 0 ? (
              <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
                <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, fontStyle: 'italic', margin: 0 }}>
                  No appointments
                </p>
              </div>
            ) : (
              dayAppts.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => onSelect(appt)}
                  style={{
                    width: '100%', textAlign: 'left', backgroundColor: '#fff',
                    border: 'none', borderBottom: `0.5px solid ${BORDER}`,
                    borderLeft: `2px solid ${BURG}`,
                    padding: '16px 20px', cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBF7F1')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT }}>
                          {formatTime(appt.startsAt)}
                        </span>
                        <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: MUTED }}>
                          {appt.service.durationMinutes} min
                        </span>
                      </div>
                      <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: TEXT, margin: '0 0 2px', lineHeight: 1.3 }}>
                        {appt.customer.fullName}
                      </p>
                      <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: '#7a6060', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appt.service.name} · {appt.staff.fullName}
                      </p>
                    </div>
                    {['confirmed', 'no_show'].includes(appt.status) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAction(appt.id, 'COMPLETED') }}
                        style={{
                          fontFamily: sans, fontSize: 10, fontWeight: 400,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: '#fff', backgroundColor: BURG,
                          border: 'none', padding: '5px 12px',
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        Mark done
                      </button>
                    ) : (
                      <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: BURG, flexShrink: 0, paddingTop: 2 }}>
                        {STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Rebook modal ──────────────────────────────────────────────────────────────
function RebookModal({ appt, onClose, onRebooked }) {
  const [date, setDate] = useState(toDateInputValue(new Date()))
  const [rebookErr, setRebookErr] = useState('')

  const { data, loading: slotsLoading } = useQuery(AVAILABILITY, {
    variables: { serviceId: appt.service.id, date, staffId: appt.staff.id },
    fetchPolicy: 'network-only',
  })

  const [rebook, { loading: rebooking }] = useMutation(REBOOK_APPOINTMENT, {
    onCompleted: () => { onRebooked(); onClose() },
    onError: (e) => setRebookErr(e.graphQLErrors?.[0]?.message || e.message),
  })

  const slots = data?.availability ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, width: '100%', maxWidth: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: sans, fontSize: 16, fontWeight: 400, color: TEXT, margin: 0 }}>Rebook appointment</h2>
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: '2px 0 0' }}>
              {appt.service.name} · {appt.staff.fullName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
          <label style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: 6 }}>Select date</label>
          <input
            type="date"
            value={date}
            min={toDateInputValue(new Date())}
            onChange={(e) => { setDate(e.target.value); setRebookErr('') }}
            style={{ border: `0.5px solid ${BORDER}`, padding: '8px 12px', fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT, backgroundColor: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '12px 20px 20px', flex: 1 }}>
          {slotsLoading && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '24px 0' }}>Loading slots…</p>}
          {!slotsLoading && slots.length === 0 && (
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '24px 0' }}>No available slots on this date.</p>
          )}
          {!slotsLoading && slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  disabled={rebooking}
                  onClick={() => rebook({ variables: { appointmentId: appt.id, newStartsAt: slot.startsAt } })}
                  style={{
                    fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT,
                    border: `0.5px solid ${BORDER}`, background: '#fff',
                    padding: '10px 0', cursor: rebooking ? 'default' : 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BURG; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = BURG }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = BORDER }}
                >
                  {formatTime(slot.startsAt)}
                </button>
              ))}
            </div>
          )}
          {rebookErr && <p style={{ fontFamily: sans, fontSize: 11, color: '#dc2626', marginTop: 12, fontWeight: 300 }}>{rebookErr}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Appointment modal ─────────────────────────────────────────────────────────
const detailLabel = { fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 300, color: '#5C4C3D', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }
const detailValue = { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#241812', margin: 0 }

function ApptModal({ appt, onClose, onAction, loading, onRebook }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
          <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: 0 }}>Appointment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 2px' }}>{appt.customer.fullName}</p>
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: MUTED, margin: 0 }}>{appt.customer.phone}</p>
            </div>
            <Badge status={appt.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><p style={detailLabel}>Service</p><p style={detailValue}>{appt.service.name}</p></div>
            <div><p style={detailLabel}>Staff</p><p style={detailValue}>{appt.staff.fullName}</p></div>
            <div><p style={detailLabel}>Time</p><p style={detailValue}>{formatTime(appt.startsAt)}</p></div>
            <div><p style={detailLabel}>Duration</p><p style={detailValue}>{appt.service.durationMinutes} min</p></div>
            <div><p style={detailLabel}>Price</p><p style={detailValue}>{formatZMW(appt.service.priceZmw)}</p></div>
            <div><p style={detailLabel}>Booked by</p><p style={{ ...detailValue, textTransform: 'capitalize' }}>{appt.bookedBy}</p></div>
          </div>

          {appt.addonServices && appt.addonServices.length > 0 && (
            <div>
              <p style={detailLabel}>Add-ons</p>
              <p style={{ ...detailValue, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {appt.addonServices.map(a => (
                  <span key={a.id}>{a.name} <span style={{ color: MUTED }}>(+{a.durationMinutes} min)</span></span>
                ))}
              </p>
            </div>
          )}

          {appt.customerNotes && (
            <div style={{ backgroundColor: '#FBF7F1', border: `0.5px solid ${BORDER}`, padding: '8px 12px', fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT }}>
              {appt.customerNotes}
            </div>
          )}

          {appt.referenceImageUrl && (
            <a href={appt.referenceImageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={appt.referenceImageUrl}
                alt="Reference photo"
                style={{ maxWidth: 160, maxHeight: 160, border: `0.5px solid ${BORDER}`, display: 'block' }}
              />
            </a>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {appt.status === 'pending' && (
              <Button size="sm" loading={loading} onClick={() => onAction(appt.id, 'CONFIRMED')}>Confirm</Button>
            )}
            {appt.status === 'confirmed' && (
              <Button size="sm" variant="warning" loading={loading} onClick={() => onAction(appt.id, 'NO_SHOW')}>No Show</Button>
            )}
            {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
              <Button size="sm" variant="danger" loading={loading} onClick={() => onAction(appt.id, 'CANCELLED')}>Cancel</Button>
            )}
            {appt.status === 'cancelled' && (
              <Button size="sm" loading={loading} onClick={onRebook}>Rebook</Button>
            )}
          </div>

          {['confirmed', 'no_show'].includes(appt.status) && (
            <Button loading={loading} className="w-full" onClick={() => onAction(appt.id, 'COMPLETED')}>
              Mark as Completed ✓
            </Button>
          )}
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
  const [rebookAppt, setRebookAppt] = useState(null)

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

  // Expired bookings (payment initiated but never completed) were never real
  // appointments. Keep them out of the grid entirely rather than cluttering
  // it next to actual confirmed/pending bookings.
  const appointments = (data?.myAppointments ?? [])
    .map((a) => ({ ...a, status: a.status?.toLowerCase() }))
    .filter((a) => a.status !== 'expired')

  const { colorMap } = useMemo(() => {
    const ids = [...new Set(appointments.map((a) => a.staff.id))]
    return {
      colorMap: Object.fromEntries(ids.map((id, i) => [id, PALETTES[i % PALETTES.length]])),
    }
  }, [appointments])

  const displayDays = view === 'week' ? days : [selDay]
  const rangeLabel  = `${days[0].toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' })} to ${days[6].toLocaleDateString('en-ZM', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // In list view, skip past days of the current week so it starts from today
  const todayStr = toDateInputValue(today)
  const listDays = useMemo(() => {
    const weekContainsToday = days.some((d) => toDateInputValue(d) === todayStr)
    return weekContainsToday ? days.filter((d) => toDateInputValue(d) >= todayStr) : days
  }, [days, todayStr])

  // Count today's appointments still needing to be marked done
  const pendingToday = useMemo(() =>
    appointments.filter(
      (a) => toDateInputValue(new Date(a.startsAt)) === todayStr &&
             a.status === 'confirmed'
    ).length,
  [appointments, todayStr])

  return (
    <PageWrapper maxWidth="full">
      {/* ── Toolbar ── */}
      <PageHeader
        title="Calendar"
        subtitle={rangeLabel}
        action={
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Week / Day / List toggle */}
            <div style={{ display: 'flex', border: `0.5px solid ${BORDER}` }}>
              {VIEW_OPTIONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  title={label}
                  style={{
                    padding: '8px 16px', fontFamily: sans, fontSize: 10, fontWeight: 300,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: 'none', borderRight: key !== 'list' ? `0.5px solid ${BORDER}` : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background-color 0.1s',
                    backgroundColor: view === key ? BURG : '#fff',
                    color: view === key ? '#fff' : MUTED,
                  }}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Prev / Next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setWkStart((d) => addDays(d, -7))}
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `0.5px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: MUTED,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBF7F1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setWkStart((d) => addDays(d, 7))}
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `0.5px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: MUTED,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBF7F1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
              >
                <ChevronRight size={14} />
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
              style={{
                border: `0.5px solid ${BORDER}`, padding: '6px 10px',
                fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT,
                backgroundColor: '#fff', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = BURG)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>
        }
      />

      {/* ── Pending completion reminder ── */}
      {!loading && pendingToday > 0 && (
        <div style={{
          backgroundColor: '#fff8f8', border: `0.5px solid #e0b0b8`,
          padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: BURG, margin: 0 }}>
            {pendingToday} appointment{pendingToday !== 1 ? 's' : ''} today still need to be marked as done.
          </p>
          {view !== 'list' && (
            <button
              onClick={() => setView('list')}
              style={{
                fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: BURG, background: 'none',
                border: `0.5px solid #e0b0b8`, padding: '4px 12px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              View list
            </button>
          )}
        </div>
      )}

      {/* ── Day pills (day view only) ── */}
      {view === 'day' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {days.map((d) => {
            const active  = sameDay(d, selDay)
            const isToday = sameDay(d, today)
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelDay(d)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 12px', flexShrink: 0, border: 'none', cursor: 'pointer',
                  transition: 'background-color 0.1s',
                  backgroundColor: active ? BURG : isToday ? '#FBF7F1' : 'transparent',
                  color: active ? '#fff' : isToday ? BURG : MUTED,
                }}
              >
                <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {d.toLocaleDateString('en-ZM', { weekday: 'short' })}
                </span>
                <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 400, marginTop: 2 }}>{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {/* ── List view ── */}
      {view === 'list' && !loading && (
        <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}` }}>
          <ListView
            days={listDays}
            appointments={appointments}
            today={today}
            onSelect={setSelAppt}
            onAction={(id, status) => updateStatus({ variables: { appointmentId: id, status } })}
          />
        </div>
      )}

      {/* ── Grid (week / day) ── */}
      {view !== 'list' && (
        <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, overflow: 'auto' }}>
          <div style={{ display: 'flex', minWidth: view === 'week' ? 620 : 0 }}>
            <TimeRuler />
            <div style={{ display: 'flex', flex: 1, gap: 1, padding: '0 2px 16px' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
          {[...new Set(appointments.map((a) => a.staff.id))].map((id) => {
            const staff = appointments.find((a) => a.staff.id === id)?.staff
            const palette = colorMap[id] ?? PALETTES[0]
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED }}>
                <span style={{ width: 10, height: 10, backgroundColor: palette.bg, display: 'inline-block' }} />
                {staff?.fullName}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Appointment modal ── */}
      {selAppt && (
        <ApptModal
          appt={selAppt}
          loading={acting}
          onClose={() => setSelAppt(null)}
          onAction={(id, status) => updateStatus({ variables: { appointmentId: id, status } })}
          onRebook={() => { setRebookAppt(selAppt); setSelAppt(null) }}
        />
      )}

      {/* ── Rebook modal ── */}
      {rebookAppt && (
        <RebookModal
          appt={rebookAppt}
          onClose={() => setRebookAppt(null)}
          onRebooked={() => { setRebookAppt(null); refetch() }}
        />
      )}
    </PageWrapper>
  )
}
