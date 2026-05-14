import { useQuery } from '@apollo/client/react'
import { Calendar, TrendingUp, Users, AlertCircle, Bot } from 'lucide-react'
import { DASHBOARD_STATS } from '../../graphql/queries/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import StatsCard from '../../components/dashboard/StatsCard'
import AgentFeed from '../../components/dashboard/AgentFeed'
import StaffList from '../../components/dashboard/StaffList'
import { formatZMW } from '../../lib/utils'
import { ErrorMessage } from '../../components/ui/Spinner'

export default function OwnerDashboard() {
  const { setProfile } = useAuth()

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
        <StatsCard icon={Calendar}    label="Bookings today"  value={stats?.todayBookings}              color="primary" loading={loading} />
        <StatsCard icon={TrendingUp}  label="Revenue today"   value={stats ? formatZMW(stats.todayRevenue) : null} color="green"   loading={loading} />
        <StatsCard icon={Bot}         label="Agent bookings"  value={stats?.bookedByAgent}              color="blue"    loading={loading} />
        <StatsCard icon={AlertCircle} label="Pending payments" value={stats?.pendingPayments}           color="yellow"  loading={loading} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <AgentFeed limit={8} />
        <StaffList />
      </div>
    </PageWrapper>
  )
}
