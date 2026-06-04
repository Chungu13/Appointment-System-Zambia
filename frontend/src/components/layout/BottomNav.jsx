import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Images, Users, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { isAuthenticated, isOwner } = useAuth()
  if (!isAuthenticated || !isOwner) return null

  const links = [
    { to: '/owner', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/owner/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/owner/portfolio', icon: Images, label: 'Portfolio' },
    { to: '/owner/staff', icon: Users, label: 'Staff' },
    { to: '/owner/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom" style={{ backgroundColor: '#fff', borderTop: '1px solid #E8D8DC' }}>
      <div className="flex">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
              fontSize: 11,
              color: isActive ? '#6B2737' : '#9B7A80',
              fontWeight: isActive ? 500 : 400,
              transition: 'color 0.12s',
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
