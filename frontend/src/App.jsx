import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { AuthProvider } from './context/AuthContext'
import { tenantClient } from './lib/apollo'

// Router helpers
import ProtectedRoute from './router/ProtectedRoute'
import TenantRoute, { getSubdomain } from './router/TenantRoute'

// Layout
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'

// Public pages
import SalonDirectory from './pages/public/SalonDirectory'
import SalonLanding from './pages/public/SalonLanding'
import SalonBooking from './pages/public/SalonBooking'
import HowItWorks from './pages/public/HowItWorks'
import ForBusinesses from './pages/public/ForBusinesses'
import Signup from './pages/public/Signup'
import Onboarding from './pages/public/Onboarding'
import Directory from './pages/public/Directory'

// Auth
import Login from './pages/auth/Login'

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard'
import Calendar from './pages/owner/Calendar'
import Services from './pages/owner/Services'
import Staff from './pages/owner/Staff'
import Customers from './pages/owner/Customers'
import Analytics from './pages/owner/Analytics'
import Settings from './pages/owner/Settings'
import Portfolio from './pages/owner/Portfolio'
import Profile from './pages/owner/Profile'

// Staff portal — no auth, shared key
import StaffPortal from './pages/staff/StaffPortal'

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="sm:pl-[220px]">
        {children}
      </div>
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

            {/* Marketing + public pages */}
            <Route path="/discover" element={<Directory />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Navigate to="/" replace />} />
            <Route path="/for-businesses" element={<ForBusinesses />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="/login" element={<Login />} />

            {/* Staff portal — shared key, no individual auth */}
            <Route path="/staff" element={<TenantRoute><StaffPortal /></TenantRoute>} />

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
                      <Route path="portfolio" element={<Portfolio />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="profile" element={<Profile />} />
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
