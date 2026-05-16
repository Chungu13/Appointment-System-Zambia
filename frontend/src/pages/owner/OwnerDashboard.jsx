import { useQuery, useMutation } from '@apollo/client/react'
import { Lightbulb, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react'
import { DASHBOARD_STATS, MY_STAFF_APPOINTMENTS, AGENT_ACTIVITY } from '../../graphql/queries/bookings'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { useAuth } from '../../context/AuthContext'
import { formatZMW, toDateInputValue, formatTime, formatDateTime } from '../../lib/utils'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

const PAGE_BG  = '#f5fbf5'
const SAGE_CARD = '#c8ddc8'
const PRIMARY  = '#2d4a30'
const MUTED    = '#6b8c6b'
const CARD_BG  = '#ffffff'
const BORDER   = '#dce8dc'

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
      <p className="text-2xl font-bold" style={{ color: PRIMARY }}>{value ?? '—'}</p>
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
          No appointments this week — enjoy the calm!
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
        <span className="font-semibold" style={{ color: PRIMARY }}>{bookedByAgent ?? '—'}</span>{' '}
        appointments and recovered{' '}
        <span className="font-semibold" style={{ color: PRIMARY }}>{slotsRecovered ?? '—'}</span>{' '}
        cancelled slots this week.
      </p>
      <button
        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: PRIMARY }}
      >
        Generate Campaign
      </button>
    </div>
  )
}

// ── AI Activity Feed ──────────────────────────────────────────────────────────
const OUTCOME_ICON = {
  success:       <CheckCircle size={13} className="text-green-600 shrink-0 mt-0.5" />,
  failed:        <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />,
  pending_human: <Clock size={13} className="text-yellow-600 shrink-0 mt-0.5" />,
}

function AIActivityFeed() {
  const { data, loading, error } = useQuery(AGENT_ACTIVITY, { variables: { limit: 8 } })

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} style={{ color: PRIMARY }} />
        <h3 className="text-sm font-semibold" style={{ color: PRIMARY }}>Glow AI Activity Feed</h3>
      </div>
      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}
      {!loading && !error && (data?.agentActivity?.length ?? 0) === 0 && (
        <p className="text-sm text-center py-4" style={{ color: MUTED }}>No activity yet.</p>
      )}
      <div className="space-y-3">
        {data?.agentActivity?.map((log) => (
          <div key={log.id} className="flex items-start gap-2.5">
            {OUTCOME_ICON[log.outcome] ?? <span className="w-[13px] shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2" style={{ color: '#333' }}>{log.action}</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>{formatDateTime(log.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { setProfile, isAlsoStaff } = useAuth()

  const { data: profileData } = useQuery(MY_PROFILE, {
    onCompleted: (d) => setProfile(d.myProfile),
  })

  const { data, loading, error } = useQuery(DASHBOARD_STATS)
  const stats = data?.dashboardStats
  const firstName = profileData?.myProfile?.fullName?.split(' ')[0] ?? ''

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
            {loading ? '—' : stats ? formatZMW(stats.todayRevenue) : '—'}
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error.message} className="mb-4" />}

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Weekly Revenue"
          value={loading ? '…' : stats ? formatZMW(stats.todayRevenue) : null}
          sub="+12% vs last week"
          sage
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '…' : stats?.todayBookings}
          sub="Appointments today"
        />
        <StatCard
          label="AI-Recovered Slots"
          value={loading ? '…' : stats?.slotsRecovered}
          sub="Cancelled → rebooked"
          sage
        />
      </div>

      {/* Main grid */}
      <div className="grid sm:grid-cols-[1fr_320px] gap-5 items-start">
        <WeeklySchedule isAlsoStaff={isAlsoStaff} />

        <div className="space-y-4">
          <AIInsightCard bookedByAgent={stats?.bookedByAgent} slotsRecovered={stats?.slotsRecovered} />
          <AIActivityFeed />
        </div>
      </div>

    </div>
  )
}
