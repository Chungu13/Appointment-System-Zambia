import { useQuery, useMutation } from '@apollo/client/react'
import { MY_APPOINTMENTS } from '../../graphql/queries/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { toDateInputValue, addDays, formatTime } from '../../lib/utils'
import { LogOut } from 'lucide-react'

const STATUS_COLOR = {
  confirmed:   'text-emerald-800 bg-emerald-50',
  pending:     'text-amber-800 bg-amber-50',
}
const STATUS_LABEL = { confirmed: 'Confirmed', pending: 'Waiting' }

function AppointmentBlock({ appt, onDone, loading }) {
  const done = ['completed', 'cancelled', 'no_show'].includes(appt.status)

  return (
    <div className={`rounded-2xl p-5 ${done ? 'opacity-60' : ''}`} style={{ backgroundColor: '#fff', border: done ? '1px solid #EDE3D6' : '1.5px solid #3B2A1E' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-2xl font-bold text-primary font-display">{formatTime(appt.startsAt)}</p>
          {!done && (
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[appt.status] ?? 'text-gray-600 bg-gray-100'}`}>
              {STATUS_LABEL[appt.status] ?? appt.status}
            </span>
          )}
        </div>
        {done && <span className="text-sm font-medium text-on-surface-variant">Done ✓</span>}
      </div>

      <p className="text-xl font-semibold text-on-surface mb-0.5">{appt.customer.fullName}</p>
      <p className="text-base text-on-surface-variant mb-4">{appt.service.name} · {appt.service.durationMinutes} min</p>

      {!done && (
        <button
          disabled={loading}
          onClick={() => onDone(appt.id, 'COMPLETED')}
          disabled={loading}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, backgroundColor: '#241812', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}
        >
          {loading ? '…' : 'Mark as done ✓'}
        </button>
      )}
    </div>
  )
}

function TomorrowPreview({ appointments }) {
  if (appointments.length === 0) {
    return <p className="text-sm text-on-surface-variant text-center py-4">Nothing booked tomorrow.</p>
  }
  return (
    <div className="space-y-0">
      {appointments.map((appt) => (
        <div key={appt.id} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/50 last:border-0">
          <span className="text-sm font-bold text-on-surface-variant w-16 shrink-0">{formatTime(appt.startsAt)}</span>
          <span className="text-sm font-semibold text-on-surface">{appt.customer.fullName}</span>
          <span className="text-sm text-on-surface-variant truncate">· {appt.service.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function StaffHome() {
  const { setProfile } = useAuth()
  const logout = useLogout()

  const today = toDateInputValue()
  const tomorrow = toDateInputValue(addDays(new Date(), 1))

  useQuery(MY_PROFILE, { onCompleted: (d) => setProfile(d.myProfile) })

  const { data: todayData, loading, error, refetch } = useQuery(MY_APPOINTMENTS, {
    variables: { dateFrom: today, dateTo: today },
    fetchPolicy: 'network-only',
  })
  const { data: tomorrowData } = useQuery(MY_APPOINTMENTS, {
    variables: { dateFrom: tomorrow, dateTo: tomorrow },
    fetchPolicy: 'network-only',
  })

  const [updateStatus, { loading: acting }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => refetch(),
  })

  const sort = (arr) => arr.slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))

  const todayAppts = sort(todayData?.myAppointments ?? [])
  const active = todayAppts.filter((a) => !['completed', 'cancelled', 'no_show'].includes(a.status))
  const doneToday = todayAppts.filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status))

  const tomorrowAppts = sort(
    (tomorrowData?.myAppointments ?? []).filter((a) => !['cancelled', 'no_show'].includes(a.status))
  )

  const allDone = !loading && active.length === 0 && doneToday.length > 0

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#FAF8F6' }}>
      {/* Header */}
      <header className="px-5 pt-10 pb-8 flex items-start justify-between" style={{ backgroundColor: '#241812', color: '#fff' }}>
        <div>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Today</p>
          <h1 className="font-display text-2xl font-bold">
            {new Date().toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <button onClick={logout} className="p-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }} title="Sign out">
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading && <PageSpinner />}
        {error && <ErrorMessage message={error.message} />}

        {!loading && todayAppts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌟</p>
            <p className="text-lg font-semibold text-on-surface">No appointments today</p>
            <p className="text-on-surface-variant mt-1">Enjoy your day!</p>
          </div>
        )}

        {active.map((appt) => (
          <AppointmentBlock key={appt.id} appt={appt} loading={acting}
            onDone={(id, status) => updateStatus({ variables: { appointmentId: id, status } })}
          />
        ))}

        {doneToday.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Done today</p>
            {doneToday.map((appt) => (
              <AppointmentBlock key={appt.id} appt={appt} loading={false} onDone={() => {}} />
            ))}
          </div>
        )}

        {allDone && (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-semibold text-on-surface text-lg">All done for today!</p>
            <p className="text-sm text-on-surface-variant mt-1">Great work. See you tomorrow.</p>
          </div>
        )}

        {/* Tomorrow */}
        <div className="mt-8 pt-6 border-t-2 border-outline-variant">
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">
            Tomorrow's schedule
          </p>
          <TomorrowPreview appointments={tomorrowAppts} />
        </div>
      </main>
    </div>
  )
}
