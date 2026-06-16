import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { TrendingUp } from 'lucide-react'
import { DASHBOARD_STATS, MY_STAFF_APPOINTMENTS } from '../../graphql/queries/bookings'
import AgentFeed from '../../components/dashboard/AgentFeed'
import GettingStarted from '../../components/dashboard/GettingStarted'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { useAuth } from '../../context/AuthContext'
import { formatZMW, toDateInputValue, formatTime } from '../../lib/utils'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'
import { startTour, isTourDone } from '../../lib/tour'

const BURG      = '#6B2737'
const TEXT      = '#1a0a0d'
const MUTED     = '#4a1527'
const HINT      = '#5c2232'
const BORDER    = '#ede5e7'
const OFF_WHITE = '#faf7f7'

const serif = "'Cormorant Garamond', Georgia, serif"
const sans  = "'Inter', sans-serif"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: 20 }}>
      <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: TEXT, margin: '0 0 4px', lineHeight: 1 }}>
        {value ?? '—'}
      </p>
      {sub && (
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: 0 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function WeeklySchedule({ isAlsoStaff }) {
  const today = toDateInputValue()
  const weekEnd = addDays(today, 6)

  const { data, loading, error, refetch } = useQuery(MY_STAFF_APPOINTMENTS, {
    variables: { dateFrom: today, dateTo: weekEnd },
    fetchPolicy: 'network-only',
    skip: !isAlsoStaff,
  })

  const [updateStatus, { loading: acting }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => refetch(),
  })

  const appts = (data?.myStaffAppointments ?? [])
    .slice()
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))

  return (
    <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: 20 }}>
      <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: '0 0 16px' }}>
        Weekly Schedule
      </p>

      {!isAlsoStaff ? (
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '32px 0' }}>
          Assign yourself as staff to see your schedule here.
        </p>
      ) : loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorMessage message={error.message} />
      ) : appts.length === 0 ? (
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '32px 0' }}>
          No appointments this week.
        </p>
      ) : (
        <div>
          {appts.map((appt, i) => {
            const done = ['completed', 'cancelled', 'no_show'].includes(appt.status)
            const inProgress = appt.status === 'in_progress'
            return (
              <div
                key={appt.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < appts.length - 1 ? `0.5px solid ${BORDER}` : 'none',
                  opacity: done ? 0.4 : 1,
                }}
              >
                <div style={{ width: 52, flexShrink: 0 }}>
                  <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: TEXT, margin: 0 }}>
                    {formatTime(appt.startsAt)}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: TEXT, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appt.service.name}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: MUTED, margin: 0 }}>
                    {appt.customer.fullName}
                  </p>
                </div>
                {done ? (
                  <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Done</span>
                ) : (
                  <button
                    disabled={acting}
                    onClick={() =>
                      updateStatus({
                        variables: { appointmentId: appt.id, status: inProgress ? 'COMPLETED' : 'IN_PROGRESS' },
                      })
                    }
                    style={{
                      fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '6px 14px',
                      color: '#fff', backgroundColor: BURG,
                      border: 'none', cursor: acting ? 'not-allowed' : 'pointer',
                      opacity: acting ? 0.5 : 1, flexShrink: 0,
                    }}
                  >
                    {inProgress ? 'Done' : 'Start'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AIInsightCard({ bookedByAgent, slotsRecovered }) {
  return (
    <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: 20 }}>
      <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: '0 0 12px' }}>
        AI Insight
      </p>
      <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, lineHeight: 1.7, color: TEXT, margin: '0 0 16px' }}>
        Your AI agent booked{' '}
        <span style={{ fontWeight: 600, color: BURG }}>{bookedByAgent ?? '—'}</span>{' '}
        appointments and recovered{' '}
        <span style={{ fontWeight: 600, color: BURG }}>{slotsRecovered ?? '—'}</span>{' '}
        cancelled slots this week.
      </p>
      <button
        disabled
        style={{
          width: '100%', padding: '10px',
          background: OFF_WHITE, border: `0.5px solid ${BORDER}`,
          cursor: 'not-allowed',
          fontFamily: sans, fontSize: 10, fontWeight: 300,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED,
        }}
      >
        Generate Campaign · Coming Soon
      </button>
    </div>
  )
}

export default function OwnerDashboard() {
  const { setProfile, isAlsoStaff } = useAuth()

  const { data: profileData } = useQuery(MY_PROFILE, {
    onCompleted: (d) => setProfile(d.myProfile),
  })

  const { data, loading, error } = useQuery(DASHBOARD_STATS)
  const stats = data?.dashboardStats
  const firstName = profileData?.myProfile?.fullName?.split(' ')[0] ?? ''

  useEffect(() => {
    if (isTourDone()) return
    const t = setTimeout(startTour, 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '28px 24px', backgroundColor: OFF_WHITE }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 4px', lineHeight: 1.2 }}>
          {greeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0, letterSpacing: '0.04em' }}>
          Here's a snapshot of your business today.
        </p>
      </div>

      {/* Revenue bar */}
      <div style={{ backgroundColor: BURG, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: '0 0 4px' }}>
            Earned Today
          </p>
          <p style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1 }}>
            {loading ? '—' : stats ? formatZMW(stats.earnedToday) : '—'}
          </p>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', letterSpacing: '0.04em' }}>
            Based on completed appointments
          </p>
        </div>
        <TrendingUp size={18} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
      </div>

      {error && <ErrorMessage message={error.message} />}

      {/* Pending completion reminder */}
      {!loading && stats?.pendingCompletion > 0 && (
        <div style={{ backgroundColor: '#fff8f8', border: '0.5px solid #e0b0b8', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: BURG, margin: 0 }}>
            {stats.pendingCompletion} appointment{stats.pendingCompletion !== 1 ? 's' : ''} today still need to be marked as done.
          </p>
          <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: BURG }}>
            Go to Calendar →
          </span>
        </div>
      )}

      {/* Getting-started checklist */}
      <GettingStarted />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Total Bookings"
          value={loading ? '…' : stats?.todayBookings}
          sub="Appointments today"
        />
        <StatCard
          label="Cancelled Today"
          value={loading ? '…' : stats?.cancelledToday ?? 0}
          sub="Appointments cancelled"
        />
        <StatCard
          label="Deposits Today"
          value={loading ? '…' : stats ? formatZMW(stats.depositsToday) : '—'}
          sub="Collected through Kimawa"
        />
        <StatCard
          label="Pending Done"
          value={loading ? '…' : stats?.pendingCompletion ?? 0}
          sub="Need marking complete"
        />
      </div>

      {/* Main grid */}
      <div className="grid sm:grid-cols-[1fr_320px] gap-5 items-start">
        <WeeklySchedule isAlsoStaff={isAlsoStaff} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AIInsightCard bookedByAgent={stats?.bookedByAgent} slotsRecovered={stats?.slotsRecovered} />
          <AgentFeed limit={8} />
        </div>
      </div>

    </div>
  )
}
