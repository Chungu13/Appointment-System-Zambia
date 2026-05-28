import { useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Activity, Scissors,
  Users, UserCircle, Settings, HelpCircle, Images, Compass,
} from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { startTour, resetTour } from '../../lib/tour'

// ── Palette ───────────────────────────────────────────────────────────────────
const BG          = '#4A1A25'
const TEXT        = '#ffffff'
const ACTIVE_BG   = '#6B2737'
const HOVER_BG    = 'rgba(255,255,255,0.08)'
const MUTED       = 'rgba(255,255,255,0.6)'
const DIVIDER     = 'rgba(255,255,255,0.12)'

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
  { to: '/owner/settings', icon: Settings,    label: 'Settings',  id: 'tour-settings' },
  { to: '/how-it-works',   icon: HelpCircle,  label: 'Support' },
]

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
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '10px',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        textDecoration: 'none',
        transition: 'background-color 0.12s',
        color: isActive ? TEXT : MUTED,
        backgroundColor: isActive ? ACTIVE_BG : hovered ? HOVER_BG : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
      {label}
    </NavLink>
  )
}

const BUSINESS_TYPE_LABELS = {
  salon:        'Salon',
  barbershop:   'Barbershop',
  nail_tech:    'Nail Studio',
  spa:          'Spa',
  lash_studio:  'Lash Studio',
  makeup_artist:'Makeup Artist',
  other:        'Beauty Business',
}

export default function Sidebar() {
  const { profile, setProfile } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

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
      className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col z-40 border-r"
      style={{ backgroundColor: BG, borderColor: DIVIDER }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-5 shrink-0">
        <Link to="/owner" style={{ textDecoration: 'none' }}>
          <p
            className="font-display text-xl font-bold leading-tight"
            style={{ color: TEXT }}
          >
            {businessName ?? 'My Salon'}
          </p>
          {businessType && (
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              {BUSINESS_TYPE_LABELS[businessType] ?? businessType}
            </p>
          )}
        </Link>
        <p className="text-xs mt-2 truncate" style={{ color: MUTED }}>
          {ownerName || 'Loading…'}
        </p>
      </div>

      {/* Book Appointment CTA */}
      <div className="px-4 pb-5 shrink-0">
        <button
          onClick={() => navigate('/book')}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEXT, color: BG }}
        >
          + Book Appointment
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3 shrink-0" style={{ height: 1, backgroundColor: DIVIDER }} />

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {mainLinks.map(({ to, end, icon, label, id }) => (
          <NavItem key={to} to={to} end={end} icon={icon} label={label} id={id} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 pt-3 space-y-0.5 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        {bottomLinks.map(({ to, icon, label, id }) => (
          <NavItem key={to} to={to} icon={icon} label={label} id={id} />
        ))}

        {/* Take the tour */}
        <button
          onClick={() => { resetTour(); startTour() }}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
          style={{ color: MUTED }}
        >
          <Compass size={15} strokeWidth={1.8} />
          Take the tour
        </button>
      </div>
    </aside>
  )
}
