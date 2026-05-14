import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Wrench, Users, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { isAuthenticated, isOwner } = useAuth()
  if (!isAuthenticated) return null

  const ownerLinks = [
    { to: '/owner', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/owner/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/owner/services', icon: Wrench, label: 'Services' },
    { to: '/owner/staff', icon: Users, label: 'Staff' },
  ]

  const staffLinks = [
    { to: '/staff', icon: Clock, label: 'Schedule', end: true },
    { to: '/staff/walk-in', icon: Users, label: 'Walk-in' },
  ]

  const links = isOwner ? ownerLinks : staffLinks

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant safe-bottom">
      <div className="flex">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
