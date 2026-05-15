import { useQuery, useMutation } from '@apollo/client/react'
import { Calendar, TrendingUp, Users, AlertCircle, Bot } from 'lucide-react'
import { DASHBOARD_STATS, MY_STAFF_APPOINTMENTS } from '../../graphql/queries/bookings'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import StatsCard from '../../components/dashboard/StatsCard'
import AgentFeed from '../../components/dashboard/AgentFeed'
import StaffList from '../../components/dashboard/StaffList'
import { formatZMW, toDateInputValue, formatTime } from '../../lib/utils'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

const STATUS_COLOR = {
  confirmed: 'text-blue-700 bg-blue-50',
  pending: 'text-yellow-700 bg-yellow-50',
  in_progress: 'text-purple-700 bg-purple-50',
}
const STATUS_LABEL = { confirmed: 'Confirmed', pending: 'Waiting', in_progress: 'In progress' }

function ScheduleToday() {
  const today = toDateInputValue()
  const { data, loading, error, refetch } = useQuery(MY_STAFF_APPOINTMENTS, {
    variables: { dateFrom: today, dateTo: today },
    fetchPolicy: 'network-only',
  })

  const [updateStatus, { loading: acting }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => refetch(),
  })

  const appts = (data?.myStaffAppointments ?? [])
    .slice()
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))

  if (loading) return <PageSpinner />
  if (error) return <ErrorMessage message={error.message} />

  if (appts.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant text-center py-6">
        No appointments today — enjoy the day!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {appts.map((appt) => {
        const done = ['completed', 'cancelled', 'no_show'].includes(appt.status)
        const inProgress = appt.status === 'in_progress'
        return (
          <div
            key={appt.id}
            className={`rounded-xl border-2 p-4 flex items-center gap-4 ${
              done ? 'border-outline-variant opacity-60' : 'border-primary bg-surface-container-lowest'
            }`}
          >
            <div className="shrink-0 text-center w-14">
              <p className="text-lg font-bold text-primary font-display">{formatTime(appt.startsAt)}</p>
              {!done && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[appt.status] ?? 'text-gray-600 bg-gray-100'}`}>
                  {STATUS_LABEL[appt.status] ?? appt.status}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface">{appt.customer.fullName}</p>
              <p className="text-sm text-on-surface-variant">{appt.service.name} · {appt.service.durationMinutes} min</p>
            </div>
            {done ? (
              <span className="text-xs font-medium text-on-surface-variant">Done ✓</span>
            ) : (
              <button
                disabled={acting}
                onClick={() => updateStatus({ variables: { appointmentId: appt.id, status: inProgress ? 'COMPLETED' : 'IN_PROGRESS' } })}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {inProgress ? 'Done ✓' : 'Start →'}
              </button>
            )}
          </div>
        )
      })}
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

  return (
    <PageWrapper>
      <PageHeader
        title="Dashboard"
        subtitle={profileData?.myProfile ? `Welcome back, ${profileData.myProfile.fullName}` : 'Your salon at a glance'}
      />

      {error && <ErrorMessage message={error.message} className="mb-6" />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Calendar}    label="Bookings today"   value={stats?.todayBookings}               color="primary" loading={loading} />
        <StatsCard icon={TrendingUp}  label="Revenue today"    value={stats ? formatZMW(stats.todayRevenue) : null} color="green"   loading={loading} />
        <StatsCard icon={Bot}         label="Agent bookings"   value={stats?.bookedByAgent}               color="blue"    loading={loading} />
        <StatsCard icon={AlertCircle} label="Pending payments" value={stats?.pendingPayments}             color="yellow"  loading={loading} />
      </div>

      {/* My schedule — only shown when owner is also the practitioner */}
      {isAlsoStaff && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">
            My schedule today
          </h2>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4">
            <ScheduleToday />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <AgentFeed limit={8} />
        <StaffList />
      </div>
    </PageWrapper>
  )
}
