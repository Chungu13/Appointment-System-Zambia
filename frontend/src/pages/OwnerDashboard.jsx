import { Routes, Route } from 'react-router-dom'

function DashboardHome() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary mb-2">
        Owner Dashboard
      </h1>
      <p className="text-on-surface-variant mb-8">Your salon at a glance.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Bookings today', value: '-' },
          { label: 'Revenue (week)', value: '-' },
          { label: 'Customers', value: '-' },
          { label: 'No-shows', value: '-' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5"
          >
            <p className="text-2xl font-bold text-on-surface">{value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6">
        <h2 className="font-semibold text-on-surface mb-3">Upcoming appointments</h2>
        <p className="text-sm text-on-surface-variant text-center py-6">
          No appointments to show yet.
        </p>
      </div>
    </main>
  )
}

export default function OwnerDashboard() {
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
    </Routes>
  )
}
