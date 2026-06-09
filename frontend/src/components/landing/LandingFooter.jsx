import { Link } from 'react-router-dom'

const PRIMARY = '#6B2737'
const BORDER  = '#f0ece8'

export default function LandingFooter() {
  return (
    <footer style={{ borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fff', paddingTop: 24, paddingBottom: 24 }} className="px-16 max-sm:px-5">
      <div
        style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}
        className="max-sm:flex-col max-sm:items-start max-sm:gap-4"
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 22 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: PRIMARY, letterSpacing: '-0.3px' }}>
            Kimawa
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'How it Works',   to: '/how-it-works' },
            { label: 'For Businesses', to: '/for-businesses' },
            { label: 'Find Services',  to: '/discover' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: '#333', textDecoration: 'none' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#333', margin: 0 }}>
          &copy; {new Date().getFullYear()} Kimawa &middot; Zambia
        </p>
      </div>
    </footer>
  )
}
