import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Wrench, Users, BarChart2, UserCircle } from 'lucide-react'
import { classNames } from '../../lib/utils'

const ownerLinks = [
  { to: '/owner', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/owner/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/owner/services', icon: Wrench, label: 'Services' },
  { to: '/owner/staff', icon: Users, label: 'Staff' },
  { to: '/owner/customers', icon: UserCircle, label: 'Customers' },
  { to: '/owner/analytics', icon: BarChart2, label: 'Analytics' },
]

export default function Sidebar() {
  return (
    <aside className="hidden sm:flex flex-col w-56 shrink-0">
      <nav className="flex flex-col gap-1">
        {ownerLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
