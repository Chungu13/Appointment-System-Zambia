import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { AuthProvider } from './context/AuthContext'
import { tenantClient } from './lib/apollo'

// Router helpers
import ProtectedRoute from './router/ProtectedRoute'
import TenantRoute, { getSubdomain } from './router/TenantRoute'

// Layout
import Navbar from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'

// Public pages
import SalonDirectory from './pages/public/SalonDirectory'
import SalonLanding from './pages/public/SalonLanding'
import SalonBooking from './pages/public/SalonBooking'

// Auth
import Login from './pages/auth/Login'

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard'
import Calendar from './pages/owner/Calendar'
import Services from './pages/owner/Services'
import Staff from './pages/owner/Staff'
import Customers from './pages/owner/Customers'
import Analytics from './pages/owner/Analytics'

// Staff pages
import StaffHome from './pages/staff/StaffHome'
import WalkIn from './pages/staff/WalkIn'
import AppointmentDetail from './pages/staff/AppointmentDetail'

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ApolloProvider client={tenantClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root — landing on subdomain, directory on plain localhost */}
            <Route
              path="/"
              element={
                getSubdomain()
                  ? <TenantRoute><SalonLanding /></TenantRoute>
                  : <SalonDirectory />
              }
            />

            {/* Booking flow — subdomain: /book, localhost fallback: /:salonSlug/book */}
            <Route path="/book" element={<TenantRoute><SalonBooking /></TenantRoute>} />
            <Route path="/:salonSlug/book" element={<TenantRoute><SalonBooking /></TenantRoute>} />

            <Route path="/login" element={<Login />} />

            {/* Path-based fallback: localhost:3000/glow-salon → landing */}
            <Route
              path="/:salonSlug"
              element={
                <TenantRoute>
                  <SalonLanding />
                </TenantRoute>
              }
            />

            {/* Owner — protected, full shell */}
            <Route
              path="/owner/*"
              element={
                <ProtectedRoute requireOwner>
                  <AppShell>
                    <Routes>
                      <Route index element={<OwnerDashboard />} />
                      <Route path="calendar" element={<Calendar />} />
                      <Route path="services" element={<Services />} />
                      <Route path="staff" element={<Staff />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="analytics" element={<Analytics />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Staff — protected, full shell */}
            <Route
              path="/staff/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route index element={<StaffHome />} />
                      <Route path="walk-in" element={<WalkIn />} />
                      <Route path="appointments/:id" element={<AppointmentDetail />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  )
}
