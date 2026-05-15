import { Link, NavLink } from 'react-router-dom'
import { Scissors, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'

const ownerLinks = [
  { to: '/owner', label: 'Dashboard', end: true },
  { to: '/owner/calendar', label: 'Calendar' },
  { to: '/owner/services', label: 'Services' },
  { to: '/owner/staff', label: 'Staff' },
  { to: '/owner/settings', label: 'Settings' },
]

export default function Navbar() {
  const { isAuthenticated, isOwner, profile } = useAuth()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-container text-on-primary-container'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
    }`

  return (
    <nav className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold shrink-0">
          <Scissors size={20} />
          <span className="font-display text-lg">BeautyBook ZM</span>
        </Link>

        {isAuthenticated && isOwner && (
          <div className="hidden sm:flex items-center gap-1">
            {ownerLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>{label}</NavLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              <Avatar name={profile?.fullName} src={profile?.avatarUrl} size="sm" />
              <button
                onClick={logout}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-1.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          )}
          {isAuthenticated && isOwner && (
            <button
              className="sm:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && isAuthenticated && isOwner && (
        <div className="sm:hidden border-t border-outline-variant bg-surface-container-low px-4 py-3 flex flex-col gap-1">
          {ownerLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
