import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { Helmet } from 'react-helmet-async'
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

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ paddingTop: 'clamp(56px, 10vw, 96px)', paddingBottom: 'clamp(48px, 8vw, 72px)', paddingLeft: 'clamp(20px, 6vw, 64px)', paddingRight: 'clamp(20px, 6vw, 64px)', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: serif, fontWeight: 400, letterSpacing: '-1.5px', lineHeight: 1.1, color: '#1a1a1a', margin: '0 0 20px', maxWidth: 680, fontSize: 'clamp(32px, 7.5vw, 68px)' }}>
          The booking platform{' '}
          <em style={{ color: PRIMARY, fontStyle: 'italic' }}>built for you.</em>
        </h1>

        <p style={{ fontFamily: sans, fontSize: 16, fontWeight: 400, color: '#333', lineHeight: 1.7, maxWidth: 480, margin: '0 0 24px' }}>
          AI powered bookings, payments, and notifications, all in one place.
        </p>

        {/* Category tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {['Hair', 'Nails', 'Barbers', 'Spa & Facial', '+ more'].map((tag) => (
            <span key={tag} style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', border: `0.5px solid #ddd`, borderRadius: 3, padding: '5px 12px' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <Link
            to="/signup"
            style={{ padding: '14px 32px', fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            List Your Business Free
          </Link>
          <Link
            to="/how-it-works"
            style={{ padding: '14px 32px', fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#333', border: `0.5px solid #ddd`, borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            &#9654; See How it Works
          </Link>
        </div>

        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: '#333', margin: '0 0 20px' }}>
          No credit card needed · Free to get started
        </p>

        {/* Trust badges — folded in from the old standalone stats bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
          {['Free to list your business', 'Local mobile money supported'].map((label) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: PRIMARY, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Salons section ────────────────────────────────────────────────────────────
function SalonsSection() {
  const { data, loading } = useQuery(ALL_SALONS, { client: publicClient })
  const salons = (data?.salons ?? []).filter((s) => s.isActive && s.isApproved).slice(0, 4)
  const placeholders = Math.max(0, 2 - salons.length)

  return (
    <section style={{ paddingTop: 'clamp(44px, 8vw, 72px)', paddingBottom: 'clamp(44px, 8vw, 72px)', paddingLeft: 'clamp(20px, 6vw, 64px)', paddingRight: 'clamp(20px, 6vw, 64px)', backgroundColor: '#fff' }}>
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

        {/* Loading skeleton */}
        {loading && (
          <>
            {/* Mobile: horizontal strip */}
            <div className="km-mobile-flex-scroll overflow-x-auto gap-3 pb-1" style={{ margin: '0 calc(-1 * clamp(20px, 6vw, 64px))', padding: '0 clamp(20px, 6vw, 64px)' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 160, flexShrink: 0, borderRadius: 10, backgroundColor: '#f5f5f5', height: 170, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="km-desktop-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ borderRadius: 12, backgroundColor: '#f5f5f5', height: 320, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </>
        )}

        {/* Loaded — mobile: horizontally scrollable strip, matching the desktop cards */}
        {!loading && (
          <>
            <div
              className="km-mobile-flex-scroll overflow-x-auto gap-3 pb-3"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', margin: '0 calc(-1 * clamp(20px, 6vw, 64px))', padding: '0 clamp(20px, 6vw, 64px) 12px' }}
            >
              {salons.map((salon) => (
                <div key={salon.id} style={{ width: 160, flexShrink: 0, scrollSnapAlign: 'start' }}>
                  <SalonCard salon={salon} compact />
                </div>
              ))}
              {Array.from({ length: placeholders }).map((_, i) => (
                <div key={`ph-${i}`} style={{ width: 160, flexShrink: 0, scrollSnapAlign: 'start' }}>
                  <SalonCard placeholder compact />
                </div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="km-desktop-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {salons.map((salon) => <SalonCard key={salon.id} salon={salon} />)}
              {Array.from({ length: placeholders }).map((_, i) => <SalonCard key={`ph-${i}`} placeholder />)}
            </div>
          </>
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
      body: 'Your calendar manages itself. No-show detection and deposit collection keep your schedule running smoothly without any manual work.',
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
      {/* Mobile: horizontally scrollable strip — card width capped so the next one peeks in as a scroll hint */}
      <div
        className="km-mobile-flex-scroll overflow-x-auto gap-4 pb-3 px-5"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {features.map(({ title, body }) => (
          <div
            key={title}
            style={{ minWidth: 230, maxWidth: 230, flexShrink: 0, scrollSnapAlign: 'start', padding: '28px 24px', border: `0.5px solid ${BORDER}`, borderRadius: 8 }}
          >
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 12px' }}>{title}</p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', lineHeight: 1.9, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Desktop: 3-col grid */}
      <div className="km-desktop-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', maxWidth: 1200, margin: '0 auto' }}>
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
// Deliberately a single line, not a second hero — the full pitch (headline,
// button, "no credit card" microcopy) already ran once at the top of the page.
function BottomCTA() {
  return (
    <section style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 'clamp(40px, 7vw, 56px)', paddingBottom: 'clamp(40px, 7vw, 56px)', paddingLeft: 'clamp(20px, 6vw, 64px)', paddingRight: 'clamp(20px, 6vw, 64px)', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <p style={{ fontFamily: serif, fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 400, color: '#1a1a1a', margin: 0 }}>
          Ready when you are.
        </p>
        <Link
          to="/signup"
          style={{ display: 'inline-block', fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '14px 32px', borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          List Your Business Free
        </Link>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonDirectory() {
  return (
    <div style={{ backgroundColor: '#fff' }}>
      <Helmet>
        <title>Kimawa | Book Beauty Salons in Zambia</title>
        <meta name="description" content="Find and book hair salons, nail technicians, spas and beauty services in Lusaka and across Zambia. Instant online booking, AI-powered." />
        <meta property="og:title" content="Kimawa | Book Beauty Salons in Zambia" />
        <meta property="og:description" content="Lusaka's beauty booking platform. Hair, nails, lashes, spas, book online instantly." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kimawa.pro" />
        <link rel="canonical" href="https://kimawa.pro" />
      </Helmet>
      <LandingNav />
      <Hero />
      <SalonsSection />
      <Features />
      <BottomCTA />
      <LandingFooter />
    </div>
  )
}
