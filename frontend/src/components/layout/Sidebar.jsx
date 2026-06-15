import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Activity, Scissors,
  Users, UserCircle, User, Settings, HelpCircle, Images, Compass, LogOut,
} from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { startTour, resetTour } from '../../lib/tour'

const BURG    = '#6B2737'
const TEXT    = '#1a0a0d'
const MUTED   = '#b09090'
const BORDER  = '#ede5e7'
const BLUSH   = '#fdf8f8'
const NAV_MUTED = '#9a8080'

const sans = "'Inter', sans-serif"
const serif = "'Cormorant Garamond', serif"

const mainLinks = [
  { to: '/owner',           icon: LayoutDashboard, label: 'Dashboard',  end: true, id: 'tour-dashboard' },
  { to: '/owner/calendar',  icon: Calendar,        label: 'Calendar',   id: 'tour-calendar' },
  { to: '/owner/analytics', icon: Activity,        label: 'Activity',   id: 'tour-activity' },
  { to: '/owner/services',  icon: Scissors,        label: 'Services',   id: 'tour-services' },
  { to: '/owner/portfolio', icon: Images,          label: 'Portfolio',  id: 'tour-portfolio' },
  { to: '/owner/staff',     icon: Users,           label: 'Staff',      id: 'tour-staff' },
  { to: '/owner/customers', icon: UserCircle,      label: 'Customers',  id: 'tour-customers' },
]

const bottomLinks = [
  { to: '/owner/settings', icon: Settings,   label: 'Settings', id: 'tour-settings' },
  { to: '/owner/profile',  icon: User,       label: 'Profile',  id: 'tour-profile'  },
  { to: '/how-it-works',   icon: HelpCircle, label: 'Support' },
]

const BUSINESS_TYPE_LABELS = {
  salon:         'Salon',
  barbershop:    'Barbershop',
  nail_tech:     'Nail Studio',
  spa:           'Spa',
  lash_studio:   'Lash Studio',
  makeup_artist: 'Makeup Artist',
  other:         'Beauty Business',
}

function NavItem({ to, end, icon: Icon, label, id }) {
  const [hovered, setHovered] = useState(false)
  const location = useLocation()
  const isActive = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <NavLink
      to={to}
      end={end}
      id={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isActive ? '9px 12px 9px 10px' : '9px 12px',
        borderLeft: isActive ? `2px solid ${BURG}` : '2px solid transparent',
        fontSize: 11,
        fontWeight: 300,
        fontFamily: sans,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        transition: 'background-color 0.1s, color 0.1s',
        color: isActive ? BURG : hovered ? BURG : NAV_MUTED,
        backgroundColor: isActive ? BLUSH : hovered ? BLUSH : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={13} strokeWidth={isActive ? 1.8 : 1.4} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { profile, setProfile } = useAuth()
  const logout = useLogout()

  const { data: profileData } = useQuery(MY_PROFILE, {
    skip: !!profile,
    onCompleted: (d) => { if (d?.myProfile) setProfile(d.myProfile) },
  })
  const ownerName = profile?.fullName ?? profileData?.myProfile?.fullName ?? ''

  const { data: settingsData } = useQuery(SALON_SETTINGS)
  const businessName = settingsData?.salonSettings?.businessName
  const businessType = settingsData?.salonSettings?.businessType

  return (
    <aside
      className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col z-40"
      style={{ backgroundColor: '#fff', borderRight: `0.5px solid ${BORDER}` }}
    >
      {/* Brand */}
      <div style={{ padding: '28px 20px 20px' }}>
        <Link to="/owner" style={{ textDecoration: 'none' }}>
          <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1.3 }}>
            {businessName ?? 'My Salon'}
          </p>
          {businessType && (
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: MUTED, margin: '4px 0 0', letterSpacing: '0.04em' }}>
              {BUSINESS_TYPE_LABELS[businessType] ?? businessType}
            </p>
          )}
        </Link>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: MUTED, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
          {ownerName || ''}
        </p>
      </div>

      <div style={{ height: '0.5px', backgroundColor: BORDER }} />

      {/* Main nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {mainLinks.map(({ to, end, icon, label, id }) => (
          <NavItem key={to} to={to} end={end} icon={icon} label={label} id={id} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div style={{ borderTop: `0.5px solid ${BORDER}`, padding: '8px 0 16px' }}>
        {bottomLinks.map(({ to, icon, label, id }) => (
          <NavItem key={to} to={to} icon={icon} label={label} id={id} />
        ))}

        <button
          onClick={() => { resetTour(); startTour() }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: sans, fontSize: 11, fontWeight: 300,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: NAV_MUTED,
            textAlign: 'left',
          }}
        >
          <Compass size={13} strokeWidth={1.4} />
          Take the tour
        </button>

        <button
          onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: sans, fontSize: 11, fontWeight: 300,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: NAV_MUTED,
            textAlign: 'left',
          }}
        >
          <LogOut size={13} strokeWidth={1.4} />
          Log out
        </button>
      </div>
    </aside>
  )
}
