import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import SalonCard from '../../components/salon/SalonCard'

const PRIMARY = '#6B2737'
const DARK    = '#1A0A0D'
const BORDER  = '#f0ece8'

const serif = 'Inter, sans-serif'
const sans  = 'Inter, sans-serif'

// ── Eyebrow ───────────────────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 18px' }}>
      {children}
    </p>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ paddingTop: 96, paddingBottom: 72, backgroundColor: '#fff' }} className="px-16 max-sm:px-5 max-sm:pt-14 max-sm:pb-12">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Eyebrow>Beauty marketplace · Zambia</Eyebrow>

        <h1 style={{ fontFamily: serif, fontSize: 68, fontWeight: 400, letterSpacing: '-1.5px', lineHeight: 1.05, color: '#1a1a1a', margin: '0 0 24px', maxWidth: 680 }} className="max-sm:text-4xl">
          Grow Your Beauty Business{' '}
          <em style={{ color: PRIMARY, fontStyle: 'italic' }}>with AI.</em>
        </h1>

        <p style={{ fontFamily: sans, fontSize: 16, fontWeight: 400, color: '#333', lineHeight: 1.7, maxWidth: 480, margin: '0 0 28px' }}>
          The all-in-one booking platform for beauty and wellness professionals across Zambia. Automate your bookings, delight your customers.
        </p>

        {/* Category tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {['Hair', 'Nails', 'Barbers', 'Spa & Facial', '+ more'].map((tag) => (
            <span key={tag} style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', border: `0.5px solid #ddd`, borderRadius: 3, padding: '5px 12px' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="justify-start max-sm:justify-center" style={{ display: 'flex', flexWrap: 'nowrap', gap: 12, marginBottom: 16 }}>
          <Link
            to="/signup"
            className="py-3.5 px-8 max-sm:flex-1 max-sm:text-center max-sm:py-3 max-sm:px-3"
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            List Your Business Free
          </Link>
          <Link
            to="/how-it-works"
            className="py-3.5 px-8 max-sm:flex-1 max-sm:text-center max-sm:py-3 max-sm:px-3"
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#333', border: `0.5px solid #ddd`, borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            &#9654; See How it Works
          </Link>
        </div>

        <p className="max-sm:text-center" style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: '#333' }}>
          No credit card needed · Free to get started
        </p>
      </div>
    </section>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: 'Free', label: 'Free to list your business' },
    { value: 'ZMW',  label: 'Local payments supported' },
  ]
  return (
    <section style={{ borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, backgroundColor: '#fff' }}>
      <div className="grid grid-cols-2" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {stats.map(({ value, label }, i) => (
          <div
            key={value}
            className="py-6 px-4 sm:py-8 sm:px-10 text-center"
            style={{ borderLeft: i > 0 ? `0.5px solid ${BORDER}` : 'none' }}
          >
            <p style={{ fontFamily: sans, fontSize: 'clamp(24px, 5vw, 38px)', fontWeight: 300, color: PRIMARY, margin: '0 0 6px', letterSpacing: '-1px' }}>
              {value}
            </p>
            <p style={{ fontFamily: sans, fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 400, color: '#333', margin: 0 }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Salons section ────────────────────────────────────────────────────────────
function SalonsSection() {
  const { data, loading } = useQuery(ALL_SALONS, { client: publicClient })
  const salons = (data?.salons ?? []).filter((s) => s.isActive).slice(0, 4)
  const placeholders = Math.max(0, 2 - salons.length)

  return (
    <section style={{ paddingTop: 72, paddingBottom: 72, backgroundColor: '#fff' }} className="px-16 max-sm:px-5">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, letterSpacing: '-0.5px', color: '#1a1a1a', margin: '0 0 8px' }}>
              Businesses already on Kimawa
            </h2>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#333', margin: 0 }}>
              Join beauty professionals across Zambia growing their business with AI.
            </p>
          </div>
          <Link to="/discover" style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: PRIMARY, textDecoration: 'none' }}>
            Explore All
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 12, backgroundColor: '#f5f5f5', height: 320, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {salons.map((salon) => <SalonCard key={salon.id} salon={salon} />)}
            {Array.from({ length: placeholders }).map((_, i) => <SalonCard key={`ph-${i}`} placeholder />)}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      title: 'Smart Scheduling',
      body: 'Your calendar manages itself. Automatic reminders, no-show detection, and deposit collection keep your schedule running smoothly without any manual work.',
    },
    {
      title: 'Business Insights',
      body: 'See your revenue, top services, and customer activity at a glance, all in Zambian Kwacha. Know exactly what is working and where to focus.',
    },
    {
      title: 'AI Booking Agent',
      body: 'Customers message your salon and the AI handles the full booking conversation from service selection to slot confirmation, 24 hours a day.',
    },
  ]
  return (
    <section style={{ borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fff' }}>
      {/* Mobile: horizontally scrollable strip */}
      <div
        className="flex sm:hidden overflow-x-auto gap-4 pb-3 px-5"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {features.map(({ title, body }) => (
          <div
            key={title}
            style={{ minWidth: 260, flexShrink: 0, scrollSnapAlign: 'start', padding: '28px 24px', border: `0.5px solid ${BORDER}`, borderRadius: 8 }}
          >
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 12px' }}>{title}</p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', lineHeight: 1.9, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Desktop: 3-col grid */}
      <div className="hidden sm:grid sm:grid-cols-3" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {features.map(({ title, body }, i) => (
          <div
            key={title}
            style={{ padding: '48px 40px', borderLeft: i > 0 ? `0.5px solid ${BORDER}` : 'none' }}
          >
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 12px' }}>{title}</p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', lineHeight: 1.9, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function BottomCTA() {
  const bullets = [
    'AI assistant answers customer questions and books appointments automatically',
    'Full calendar management with reminders and deposit collection',
    'Real-time analytics in Zambian Kwacha',
  ]
  return (
    <section style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 80, paddingBottom: 80, backgroundColor: '#fff' }} className="px-16 max-sm:px-5 max-sm:py-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-20 items-center" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Left */}
        <div>
          <Eyebrow>Ready to grow</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px]" style={{ fontFamily: serif, fontWeight: 400, letterSpacing: '-1px', color: '#1a1a1a', margin: '0 0 16px', lineHeight: 1.1 }}>
            Precision Tools for Beauty Professionals
          </h2>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#333', lineHeight: 1.7, margin: '0 0 32px' }}>
            Automate your bookings, delight your customers.
          </p>
          <Link
            to="/signup"
            style={{ display: 'inline-block', fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '14px 32px', borderRadius: 3, textDecoration: 'none' }}
          >
            List Your Business Free
          </Link>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: '#333', marginTop: 12 }}>
            No credit card needed · Free to get started
          </p>
        </div>

        {/* Right */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bullets.map((b) => (
            <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: PRIMARY, flexShrink: 0, marginTop: 7 }} />
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#333', lineHeight: 1.6 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonDirectory() {
  return (
    <div style={{ backgroundColor: '#fff' }}>
      <LandingNav />
      <Hero />
      <StatsBar />
      <SalonsSection />
      <Features />
      <BottomCTA />
      <LandingFooter />
    </div>
  )
}
