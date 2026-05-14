import { Routes, Route } from 'react-router-dom'

function ScheduleHome() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary mb-2">
        Staff View
      </h1>
      <p className="text-on-surface-variant mb-8">Today's schedule.</p>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5">
        <h2 className="font-semibold text-on-surface mb-3">Appointments</h2>
        <p className="text-sm text-on-surface-variant text-center py-6">
          No appointments scheduled.
        </p>
      </div>
    </main>
  )
}

export default function StaffView() {
  return (
    <Routes>
      <Route index element={<ScheduleHome />} />
    </Routes>
  )
}
