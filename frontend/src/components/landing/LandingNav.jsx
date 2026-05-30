import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const PRIMARY = '#6B2737'
const BORDER  = '#f0ece8'

const NAV_LINKS = [
  { label: 'How it Works', to: '/how-it-works' },
  { label: 'Pricing',      to: '/pricing' },
  { label: 'For Businesses', to: '/for-businesses' },
]

export default function LandingNav({ variant = 'public' }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{ backgroundColor: '#fff', borderBottom: `0.5px solid ${BORDER}` }} className="sticky top-0 z-50">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 64px 0 32px' }} className="flex items-center justify-between h-16 max-sm:px-5">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 56 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 300, color: PRIMARY, letterSpacing: '-0.5px' }}>
            Kimawa
          </span>
        </Link>

        {/* Center links — desktop */}
        {variant === 'public' && (
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 400,
                  color: pathname.startsWith(to) ? PRIMARY : '#1a1a1a',
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                  borderBottom: pathname.startsWith(to) ? `1px solid ${PRIMARY}` : '1px solid transparent',
                  paddingBottom: 1,
                  transition: 'color 0.12s',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right CTAs — desktop */}
        <div className="hidden md:flex items-center gap-5">
          {variant === 'public' && (
            <Link
              to="/discover"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#888', textDecoration: 'none' }}
            >
              Find Beauty Services
            </Link>
          )}
          <Link
            to="/login"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#1a1a1a', textDecoration: 'none' }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: '#fff',
              backgroundColor: PRIMARY,
              padding: '10px 22px',
              borderRadius: 3,
              textDecoration: 'none',
            }}
          >
            List Your Business
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} style={{ color: '#1a1a1a' }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} style={{ fontSize: 14, color: '#1a1a1a', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
          <Link to="/discover" onClick={() => setOpen(false)} style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>Find Beauty Services</Link>
          <Link to="/login" onClick={() => setOpen(false)} style={{ fontSize: 14, color: '#1a1a1a', textDecoration: 'none' }}>Login</Link>
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '11px 20px', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}
          >
            List Your Business
          </Link>
        </div>
      )}
    </nav>
  )
}
