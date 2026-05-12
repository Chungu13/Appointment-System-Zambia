import { TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <span className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function Owner() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-violet-700 mb-1">Owner Dashboard</h1>
        <p className="text-gray-500">Your salon at a glance.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar}   label="Bookings today"  value="—"  color="violet" />
        <StatCard icon={TrendingUp} label="Revenue (week)"  value="—"  color="green"  />
        <StatCard icon={Users}      label="Customers"       value="—"  color="blue"   />
        <StatCard icon={AlertCircle} label="No-shows"       value="—"  color="rose"   />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Upcoming appointments</h2>
        <p className="text-sm text-gray-400 text-center py-6">No appointments to show yet.</p>
      </div>
    </main>
  )
}
