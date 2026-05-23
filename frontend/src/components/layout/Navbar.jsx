import { Link } from 'react-router-dom'
import { Scissors, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'

export default function Navbar() {
  const { isAuthenticated, profile } = useAuth()
  const logout = useLogout()

  return (
    <nav className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold shrink-0">
          <Scissors size={20} />
          <span className="font-display text-lg">Kimawa</span>
        </Link>

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
        </div>
      </div>
    </nav>
  )
}
