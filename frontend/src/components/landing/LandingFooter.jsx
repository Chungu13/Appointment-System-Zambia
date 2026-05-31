import { Link } from 'react-router-dom'

const PRIMARY = '#6B2737'
const BORDER  = '#f0ece8'

export default function LandingFooter() {
  return (
    <footer style={{ borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fff', padding: '24px 64px' }}>
      <div
        style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}
        className="max-sm:px-5 max-sm:flex-col max-sm:items-start max-sm:gap-4"
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 300, color: PRIMARY, letterSpacing: '-0.5px' }}>
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
