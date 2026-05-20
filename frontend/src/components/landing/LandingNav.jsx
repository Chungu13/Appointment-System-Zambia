import { Link, useLocation } from 'react-router-dom'

const PRIMARY = '#6B2737'
const TEXT    = '#1a2e1c'
const MUTED   = '#6b7c6d'

const NAV_LINKS = [
  { label: 'How it Works',   to: '/how-it-works' },
  { label: 'Pricing',        to: '/pricing' },
  { label: 'For Businesses', to: '/for-businesses' },
]

export default function LandingNav() {
  const { pathname } = useLocation()

  function isActive(to) {
    return pathname.startsWith(to)
  }

  return (
    <nav
      style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8f0e8' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight shrink-0"
          style={{ color: PRIMARY }}
        >
          BeautyBook ZM
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium pb-0.5 transition-colors whitespace-nowrap"
              style={{
                color: TEXT,
                borderBottom: isActive(to) ? `2px solid ${PRIMARY}` : '2px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            to="/directory"
            className="text-sm font-medium hidden sm:block transition-opacity hover:opacity-70"
            style={{ color: MUTED }}
          >
            Find a Beauty Pro
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium hidden sm:block transition-opacity hover:opacity-70"
            style={{ color: PRIMARY }}
          >
            Owner Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            List Your Business
          </Link>
        </div>
      </div>
    </nav>
  )
}
