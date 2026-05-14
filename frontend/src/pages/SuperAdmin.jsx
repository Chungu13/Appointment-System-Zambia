import { Routes, Route } from 'react-router-dom'

function AdminHome() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary mb-2">
        Super Admin
      </h1>
      <p className="text-on-surface-variant mb-8">Platform management.</p>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6">
        <h2 className="font-semibold text-on-surface mb-3">Tenants</h2>
        <p className="text-sm text-on-surface-variant text-center py-6">
          Tenant management coming soon.
        </p>
      </div>
    </main>
  )
}

export default function SuperAdmin() {
  return (
    <Routes>
      <Route index element={<AdminHome />} />
    </Routes>
  )
}
