import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Scissors, UserCircle,
  MoreHorizontal, Activity, Images, Users, User, Settings,
  HelpCircle, Compass, LogOut, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import { startTour, resetTour } from '../../lib/tour'

const BURG   = '#3B2A1E'
const MUTED  = '#5C4C3D'
const BORDER = '#EDE3D6'
const TEXT   = '#241812'

const sans = "'Inter', sans-serif"

const PRIMARY_LINKS = [
  { to: '/owner',           icon: LayoutDashboard, label: 'Home',      end: true, id: 'tour-dashboard-m' },
  { to: '/owner/calendar',  icon: Calendar,        label: 'Calendar',  id: 'tour-calendar-m' },
  { to: '/owner/services',  icon: Scissors,        label: 'Services',  id: 'tour-services-m' },
  { to: '/owner/customers', icon: UserCircle,      label: 'Customers', id: 'tour-customers-m' },
]

const MORE_LINKS = [
  { to: '/owner/analytics', icon: Activity, label: 'Activity' },
  { to: '/owner/portfolio', icon: Images,   label: 'Portfolio' },
  { to: '/owner/staff',     icon: Users,    label: 'Staff' },
  { to: '/owner/profile',   icon: User,     label: 'Profile' },
  { to: '/owner/settings',  icon: Settings, label: 'Settings' },
  { to: '/owner/support',   icon: HelpCircle, label: 'Support' },
]

export default function BottomNav() {
  const { isAuthenticated, isOwner } = useAuth()
  const logout = useLogout()
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!isAuthenticated || !isOwner) return null

  const moreIsActive = MORE_LINKS.some((l) => location.pathname === l.to || location.pathname.startsWith(l.to + '/'))

  function navTo(to) {
    setSheetOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        style={{ backgroundColor: '#fff', borderTop: `0.5px solid ${BORDER}` }}
      >
        <div style={{ display: 'flex' }}>
          {PRIMARY_LINKS.map(({ to, icon: Icon, label, end, id }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              id={id}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                paddingTop: 8,
                paddingBottom: 8,
                textDecoration: 'none',
                fontFamily: sans,
                fontSize: 10,
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '0.02em',
                color: isActive ? BURG : MUTED,
                transition: 'color 0.12s',
              })}
            >
              <Icon size={20} strokeWidth={1.6} />
              {label}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              paddingTop: 8,
              paddingBottom: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: sans,
              fontSize: 10,
              fontWeight: moreIsActive ? 500 : 400,
              letterSpacing: '0.02em',
              color: moreIsActive ? BURG : MUTED,
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.6} />
            More
          </button>
        </div>
      </nav>

      {/* Slide-up sheet */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(26,10,13,0.5)' }}
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ backgroundColor: '#fff', borderTop: `0.5px solid ${BORDER}` }}
          >
            {/* Sheet header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>
                More
              </p>
              <button
                onClick={() => setSheetOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Link grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {MORE_LINKS.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <button
                    key={to}
                    onClick={() => navTo(to)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '20px 8px',
                      background: 'none',
                      border: 'none',
                      borderRight: `0.5px solid ${BORDER}`,
                      borderBottom: `0.5px solid ${BORDER}`,
                      cursor: 'pointer',
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? BURG : TEXT,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} color={isActive ? BURG : '#7a6060'} />
                    {label}
                  </button>
                )
              })}

              {/* Tour */}
              <button
                onClick={() => { setSheetOpen(false); resetTour(); startTour() }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 6, padding: '20px 8px',
                  background: 'none', border: 'none', borderRight: `0.5px solid ${BORDER}`,
                  borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer',
                  fontFamily: sans, fontSize: 11, fontWeight: 400, color: TEXT,
                }}
              >
                <Compass size={22} strokeWidth={1.5} color="#7a6060" />
                Tour
              </button>

              {/* Log out */}
              <button
                onClick={() => { setSheetOpen(false); logout() }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 6, padding: '20px 8px',
                  background: 'none', border: 'none', borderBottom: `0.5px solid ${BORDER}`,
                  cursor: 'pointer',
                  fontFamily: sans, fontSize: 11, fontWeight: 400, color: '#b91c1c',
                }}
              >
                <LogOut size={22} strokeWidth={1.5} color="#b91c1c" />
                Log out
              </button>
            </div>

            {/* Safe area spacer */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </>
      )}
    </>
  )
}
