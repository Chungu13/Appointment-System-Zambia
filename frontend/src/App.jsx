import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { SignupProvider } from './context/SignupContext'
import { tenantClient } from './lib/apollo'

// Router helpers — kept eager (tiny, needed before any route renders)
import ProtectedRoute from './router/ProtectedRoute'
import TenantRoute, { getSubdomain } from './router/TenantRoute'

// Layout — kept eager (shell is always present)
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'

// Public pages — lazy loaded
const SalonDirectory   = lazy(() => import('./pages/public/SalonDirectory'))
const SalonLanding     = lazy(() => import('./pages/public/SalonLanding'))
const SalonBooking     = lazy(() => import('./pages/public/SalonBooking'))
const HowItWorks       = lazy(() => import('./pages/public/HowItWorks'))
const ForBusinesses    = lazy(() => import('./pages/public/ForBusinesses'))
const Directory        = lazy(() => import('./pages/public/Directory'))

// Signup flow — lazy loaded
const SignupStep1         = lazy(() => import('./pages/public/SignupStep1'))
const SignupStep2         = lazy(() => import('./pages/public/SignupStep2'))
const SignupVerifyEmail   = lazy(() => import('./pages/public/SignupVerifyEmail'))

// Auth
const Login = lazy(() => import('./pages/auth/Login'))

// Owner pages — lazy loaded
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'))
const Calendar       = lazy(() => import('./pages/owner/Calendar'))
const Services       = lazy(() => import('./pages/owner/Services'))
const Staff          = lazy(() => import('./pages/owner/Staff'))
const Customers      = lazy(() => import('./pages/owner/Customers'))
const Analytics      = lazy(() => import('./pages/owner/Analytics'))
const Settings       = lazy(() => import('./pages/owner/Settings'))
const Portfolio      = lazy(() => import('./pages/owner/Portfolio'))
const Profile        = lazy(() => import('./pages/owner/Profile'))
const PendingApproval = lazy(() => import('./pages/owner/PendingApproval'))

// Staff portal
const StaffPortal = lazy(() => import('./pages/staff/StaffPortal'))

import { useVersionCheck } from './hooks/useVersionCheck'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function VersionGuard() {
  useVersionCheck()
  return null
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <VersionGuard />
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ApolloProvider client={tenantClient}>
        <SignupProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={null}>
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

                {/* Multi-step signup flow */}
                <Route path="/signup" element={<SignupStep1 />} />
                <Route path="/signup/business" element={<SignupStep2 />} />
                <Route path="/signup/verify-email" element={<SignupVerifyEmail />} />

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

                {/* Pending approval — authenticated but not yet approved */}
                <Route
                  path="/owner/pending"
                  element={
                    <ProtectedRoute requireOwner>
                      <PendingApproval />
                    </ProtectedRoute>
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
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </SignupProvider>
      </ApolloProvider>
    </GoogleOAuthProvider>
  )
}
