import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Lightbulb } from 'lucide-react'
import { DASHBOARD_STATS, MY_STAFF_APPOINTMENTS } from '../../graphql/queries/bookings'
import AgentFeed from '../../components/dashboard/AgentFeed'
import GettingStarted from '../../components/dashboard/GettingStarted'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { useAuth } from '../../context/AuthContext'
import { formatZMW, toDateInputValue, formatTime } from '../../lib/utils'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'
import { startTour, isTourDone } from '../../lib/tour'

const PAGE_BG  = '#FDF5F6'
const SAGE_CARD = '#E8C4CC'
const PRIMARY  = '#6B2737'
const MUTED    = '#8B4A5A'
const CARD_BG  = '#ffffff'
const BORDER   = '#D4B0B8'

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

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, sage }) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ backgroundColor: sage ? SAGE_CARD : CARD_BG, border: sage ? 'none' : `1px solid ${BORDER}` }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: sage ? '#3d6040' : MUTED }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: PRIMARY }}>{value ?? '-'}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: sage ? '#3d6040' : MUTED }}>{sub}</p>}
    </div>
  )
}

// ── Weekly schedule ───────────────────────────────────────────────────────────
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
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: PRIMARY }}>Weekly Schedule</h3>

      {!isAlsoStaff ? (
        <p className="text-sm text-center py-8" style={{ color: MUTED }}>
          Assign yourself as staff to see your schedule here.
        </p>
      ) : loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorMessage message={error.message} />
      ) : appts.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: MUTED }}>
          No appointments this week. Enjoy the calm!
        </p>
      ) : (
        <div className="space-y-2">
          {appts.map((appt) => {
            const done = ['completed', 'cancelled', 'no_show'].includes(appt.status)
            const inProgress = appt.status === 'in_progress'
            return (
              <div
                key={appt.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                style={{ backgroundColor: done ? '#f0f5f0' : SAGE_CARD + '55', opacity: done ? 0.6 : 1 }}
              >
                <div className="shrink-0 w-14 text-center">
                  <p className="text-xs font-bold tabular-nums" style={{ color: PRIMARY }}>
                    {formatTime(appt.startsAt)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: PRIMARY }}>
                    {appt.service.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: MUTED }}>
                    {appt.customer.fullName}
                  </p>
                </div>
                {done ? (
                  <span className="text-xs shrink-0" style={{ color: MUTED }}>Done ✓</span>
                ) : (
                  <button
                    disabled={acting}
                    onClick={() =>
                      updateStatus({
                        variables: { appointmentId: appt.id, status: inProgress ? 'COMPLETED' : 'IN_PROGRESS' },
                      })
                    }
                    className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {inProgress ? 'Done' : 'Start →'}
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

// ── AI Insight card ───────────────────────────────────────────────────────────
function AIInsightCard({ bookedByAgent, slotsRecovered }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} style={{ color: PRIMARY }} />
        <h3 className="text-sm font-semibold" style={{ color: PRIMARY }}>AI Insight</h3>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>
        Your AI agent booked{' '}
        <span className="font-semibold" style={{ color: PRIMARY }}>{bookedByAgent ?? '-'}</span>{' '}
        appointments and recovered{' '}
        <span className="font-semibold" style={{ color: PRIMARY }}>{slotsRecovered ?? '-'}</span>{' '}
        cancelled slots this week.
      </p>
      <button
        disabled
        className="w-full py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
        style={{ backgroundColor: '#e0e0e0', color: '#9e9e9e' }}
      >
        Generate Campaign · Coming Soon
      </button>
      <p className="text-xs text-center mt-2" style={{ color: MUTED }}>
        AI-powered promotions coming soon
      </p>
    </div>
  )
}

// ── AI Activity Feed ──────────────────────────────────────────────────────────

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { setProfile, isAlsoStaff } = useAuth()

  const { data: profileData } = useQuery(MY_PROFILE, {
    onCompleted: (d) => setProfile(d.myProfile),
  })

  const { data, loading, error } = useQuery(DASHBOARD_STATS)
  const stats = data?.dashboardStats
  const firstName = profileData?.myProfile?.fullName?.split(' ')[0] ?? ''

  // Auto-start the tour on first login only
  useEffect(() => {
    if (isTourDone()) return
    const t = setTimeout(startTour, 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen px-6 py-7" style={{ backgroundColor: PAGE_BG }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: PRIMARY }}
          >
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Here's a snapshot of your business today.
          </p>
        </div>

        {/* Revenue today */}
        <div
          className="rounded-2xl px-5 py-3 shrink-0"
          style={{ backgroundColor: PRIMARY, color: '#fff' }}
        >
          <p className="text-xs font-medium" style={{ opacity: 0.75 }}>Revenue Today</p>
          <p className="text-xl font-bold tabular-nums">
            {loading ? '-' : stats ? formatZMW(stats.todayRevenue) : '-'}
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error.message} className="mb-4" />}

      {/* Getting-started checklist */}
      <GettingStarted />

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Today's Revenue"
          value={loading ? '…' : stats ? formatZMW(stats.todayRevenue) : null}
          sage
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '…' : stats?.todayBookings}
          sub="Appointments today"
        />
        <StatCard
          label="Slots Recovered"
          value={loading ? '…' : stats?.slotsRecovered}
          sub="Filled from cancellations and waitlist"
          sage
        />
      </div>

      {/* Main grid */}
      <div className="grid sm:grid-cols-[1fr_320px] gap-5 items-start">
        <WeeklySchedule isAlsoStaff={isAlsoStaff} />

        <div className="space-y-4">
          <AIInsightCard bookedByAgent={stats?.bookedByAgent} slotsRecovered={stats?.slotsRecovered} />
          <AgentFeed limit={8} />
        </div>
      </div>

    </div>
  )
}
