import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { KeyRound, Search, X, ChevronDown } from 'lucide-react'
import { ALL_APPOINTMENTS_TODAY } from '../../graphql/queries/tenant'
import { VERIFY_STAFF_KEY, STAFF_UPDATE_APPOINTMENT } from '../../graphql/mutations/tenant'
import { toDateInputValue, addDays, formatTime } from '../../lib/utils'

const SESSION_KEY = 'beautybook_staff_key'

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStoredKey() {
  try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' }
}
function storeKey(k) {
  try { sessionStorage.setItem(SESSION_KEY, k) } catch {}
}
function clearStoredKey() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

// ── Step 1: Key entry ─────────────────────────────────────────────────────────
function KeyEntry({ onVerified }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [verifyKey, { loading }] = useMutation(VERIFY_STAFF_KEY)

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await verifyKey({ variables: { key: key.trim() } })
      if (data?.verifyStaffKey) {
        storeKey(key.trim())
        onVerified(key.trim())
      } else {
        setError('Wrong key. Ask your owner for the current staff access key.')
      }
    } catch {
      setError('Could not connect. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Staff portal</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Enter your salon's staff access key to see today's schedule
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. GLOW2024"
            autoFocus
            className="w-full px-4 py-3 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface text-center text-xl font-bold tracking-widest uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={!key.trim() || loading}
            className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold text-base disabled:opacity-50 hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Appointment card ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
  pending:   'text-yellow-700 bg-yellow-50 border-yellow-200',
  in_progress: 'text-purple-700 bg-purple-50 border-purple-200',
  completed: 'text-gray-500 bg-gray-50 border-gray-200',
}

function AppointmentCard({ appt, isOwn, staffKey, onDone }) {
  const done = ['completed', 'cancelled', 'no_show'].includes(appt.status)
  const inProgress = appt.status === 'in_progress'

  const [updateAppt, { loading }] = useMutation(STAFF_UPDATE_APPOINTMENT, {
    onCompleted: () => onDone(),
  })

  return (
    <div className={`rounded-2xl border-2 p-4 transition-opacity ${done ? 'opacity-50' : ''} ${isOwn && !done ? 'border-primary bg-surface-container-lowest' : 'border-outline-variant'}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-center w-14">
          <p className={`text-lg font-bold font-display ${isOwn ? 'text-primary' : 'text-on-surface'}`}>
            {formatTime(appt.startsAt)}
          </p>
          <p className="text-xs text-on-surface-variant">{appt.serviceDuration}m</p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface">{appt.customerName}</p>
          <p className="text-sm text-on-surface-variant">{appt.serviceName}</p>
          {!isOwn && (
            <p className="text-xs text-on-surface-variant mt-0.5 font-medium">{appt.staffName}</p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {done ? (
            <span className="text-xs text-on-surface-variant">Done ✓</span>
          ) : (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[appt.status] ?? 'text-gray-600 bg-gray-100 border-gray-200'}`}>
              {appt.status.replace('_', ' ')}
            </span>
          )}
          {isOwn && !done && (
            <button
              disabled={loading}
              onClick={() => updateAppt({ variables: { key: staffKey, appointmentId: appt.id, status: inProgress ? 'completed' : 'in_progress' } })}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '…' : inProgress ? 'Done ✓' : 'Start →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Daily schedule ────────────────────────────────────────────────────
function DaySchedule({ staffKey, onSignOut }) {
  const [nameFilter, setNameFilter] = useState('')
  const [showTomorrow, setShowTomorrow] = useState(false)

  const today = toDateInputValue()
  const tomorrow = toDateInputValue(addDays(new Date(), 1))

  const { data: todayData, loading: todayLoading, error: todayError, refetch } = useQuery(ALL_APPOINTMENTS_TODAY, {
    variables: { key: staffKey, date: today },
    fetchPolicy: 'network-only',
    pollInterval: 60000,
  })

  const { data: tomorrowData, loading: tomorrowLoading } = useQuery(ALL_APPOINTMENTS_TODAY, {
    variables: { key: staffKey, date: tomorrow },
    skip: !showTomorrow,
    fetchPolicy: 'network-only',
  })

  const todayAppts = todayData?.allAppointmentsToday ?? []
  const tomorrowAppts = tomorrowData?.allAppointmentsToday ?? []

  const trimmed = nameFilter.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmed) return todayAppts
    return todayAppts.filter((a) => a.staffName.toLowerCase().includes(trimmed))
  }, [todayAppts, trimmed])

  const active = filtered.filter((a) => !['completed', 'cancelled', 'no_show'].includes(a.status))
  const done = filtered.filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status))

  const isFiltering = !!trimmed

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="bg-primary text-on-primary px-5 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-on-primary/70 text-sm mb-1">Today</p>
            <h1 className="font-display text-xl font-bold">
              {new Date().toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
            <p className="text-on-primary/70 text-sm mt-1">
              {todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { clearStoredKey(); onSignOut() }}
            className="text-xs text-on-primary/60 hover:text-on-primary/90 mt-1 transition-colors"
          >
            Change key
          </button>
        </div>
      </header>

      {/* Name filter */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b border-outline-variant/50">
        <div className="relative max-w-lg mx-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Type your name to filter…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          {nameFilter && (
            <button onClick={() => setNameFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              <X size={16} />
            </button>
          )}
        </div>
        {isFiltering && (
          <p className="text-xs text-center text-on-surface-variant mt-2">
            Showing {filtered.length} appointment{filtered.length !== 1 ? 's' : ''} for <strong>"{nameFilter.trim()}"</strong>
          </p>
        )}
      </div>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {todayLoading && (
          <div className="text-center py-12 text-on-surface-variant">Loading schedule…</div>
        )}
        {todayError && (
          <div className="text-center py-12 text-red-600 text-sm">
            Could not load schedule. <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        )}

        {!todayLoading && todayAppts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌟</p>
            <p className="text-lg font-semibold text-on-surface">No appointments today</p>
            <p className="text-on-surface-variant mt-1">Enjoy your day!</p>
          </div>
        )}

        {!todayLoading && todayAppts.length > 0 && filtered.length === 0 && isFiltering && (
          <div className="text-center py-12 text-on-surface-variant text-sm">
            No appointments found for "{nameFilter.trim()}"
          </div>
        )}

        {/* Active appointments */}
        {active.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            isOwn={isFiltering}
            staffKey={staffKey}
            onDone={() => refetch()}
          />
        ))}

        {/* Done today */}
        {done.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Done today</p>
            {done.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                isOwn={false}
                staffKey={staffKey}
                onDone={() => refetch()}
              />
            ))}
          </div>
        )}

        {/* Tomorrow */}
        <div className="mt-6 pt-5 border-t-2 border-outline-variant">
          <button
            onClick={() => setShowTomorrow((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3 w-full"
          >
            <span>Tomorrow's schedule</span>
            <ChevronDown size={14} className={`transition-transform ${showTomorrow ? 'rotate-180' : ''}`} />
          </button>

          {showTomorrow && (
            tomorrowLoading ? (
              <p className="text-sm text-on-surface-variant text-center py-4">Loading…</p>
            ) : tomorrowAppts.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">Nothing booked tomorrow.</p>
            ) : (
              <div className="space-y-2">
                {tomorrowAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/40 last:border-0">
                    <span className="text-sm font-bold text-on-surface-variant w-14 shrink-0">{formatTime(appt.startsAt)}</span>
                    <span className="text-sm font-semibold text-on-surface">{appt.customerName}</span>
                    <span className="text-sm text-on-surface-variant truncate">· {appt.serviceName}</span>
                    <span className="text-xs text-on-surface-variant ml-auto shrink-0">{appt.staffName}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function StaffPortal() {
  const [staffKey, setStaffKey] = useState(() => getStoredKey())

  useEffect(() => {
    if (staffKey) storeKey(staffKey)
  }, [staffKey])

  if (!staffKey) {
    return <KeyEntry onVerified={(k) => setStaffKey(k)} />
  }

  return (
    <DaySchedule
      staffKey={staffKey}
      onSignOut={() => setStaffKey('')}
    />
  )
}
