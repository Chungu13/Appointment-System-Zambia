import { useQuery } from '@apollo/client/react'
import { Play, CalendarDays, BarChart3, MapPin, Star, Check } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import { getSalonUrl } from '../../lib/utils'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

// ── Theme ─────────────────────────────────────────────────────────────────────
const PRIMARY    = '#6B2737'
const DARK_CARD  = '#4A1A25'
const TEXT       = '#1A0A0D'
const MUTED      = '#6B4A50'
const CREAM      = '#FDF5F6'
const CREAM_ALT  = '#FAF0F2'
const CHIP       = '#E8C4CC'
const BORDER     = '#D4B0B8'

// ── Data ──────────────────────────────────────────────────────────────────────
const SALON_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'https://images.unsplash.com/photo-1582095133179-bfd08e2533cf?w=800&q=80',
]

const TYPE_LABELS = {
  salon:         'Salon',
  barbershop:    'Barbershop',
  nail_tech:     'Nail Tech',
  spa:           'Spa',
  lash_studio:   'Lash Studio',
  makeup_artist: 'Makeup Artist',
}

const TYPE_SERVICES = {
  salon:         ['Haircut', 'Colour', 'Styling'],
  barbershop:    ['Fade', 'Shape Up', 'Beard Trim'],
  nail_tech:     ['Manicure', 'Pedicure', 'Nail Art'],
  spa:           ['Massage', 'Facial', 'Body Wrap'],
  lash_studio:   ['Lash Extensions', 'Lash Lift', 'Brow Tint'],
  makeup_artist: ['Bridal Makeup', 'Party Glam', 'Natural Look'],
}

const STATS = [
  { value: 'Free',   label: 'Free while we launch in Zambia' },
  { value: 'ZMW',   label: 'Local payments supported' },
  { value: 'Zero',  label: 'Setup fees, ever' },
]

// ── Hero mockup pieces ─────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div
      style={{
        width: 210,
        height: 420,
        borderRadius: 32,
        border: '3px solid #1A0A0D',
        background: '#fff',
        boxShadow: '0 24px 60px rgba(107,39,55,0.22), 0 4px 16px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar */}
      <div style={{ background: '#4A1A25', padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>G</span>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, lineHeight: 1 }}>Glow Salon</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9 }}>Online</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, background: '#FDF5F6', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'hidden' }}>
        {/* Customer message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#6B2737', color: '#fff', borderRadius: '14px 14px 3px 14px', padding: '6px 10px', fontSize: 10, maxWidth: '75%', lineHeight: 1.4 }}>
            I want braids Saturday
          </div>
        </div>

        {/* Agent message */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ background: '#fff', color: '#1A0A0D', borderRadius: '14px 14px 14px 3px', padding: '7px 10px', fontSize: 10, maxWidth: '82%', lineHeight: 1.5, borderLeft: '2px solid #6B2737' }}>
            Found 2 slots with Alice:<br />
            9:00am or 11:00am<br />
            Which works for you?
          </div>
        </div>

        {/* Customer message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#6B2737', color: '#fff', borderRadius: '14px 14px 3px 14px', padding: '6px 10px', fontSize: 10, maxWidth: '65%', lineHeight: 1.4 }}>
            9am please
          </div>
        </div>

        {/* Agent confirmation */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ background: '#fff', color: '#1A0A0D', borderRadius: '14px 14px 14px 3px', padding: '7px 10px', fontSize: 10, maxWidth: '80%', lineHeight: 1.5, borderLeft: '2px solid #6B2737' }}>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>Booked! ✓</span><br />
            Deposit ZMW 50 due
          </div>
        </div>

        {/* Input bar */}
        <div style={{ marginTop: 'auto', background: '#fff', borderRadius: 20, padding: '6px 10px', fontSize: 9, color: '#9CA3AF', border: '1px solid #D4B0B8' }}>
          Type a message…
        </div>
      </div>
    </div>
  )
}

function DashboardCard() {
  return (
    <div
      style={{
        width: 268,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 8px 32px rgba(107,39,55,0.13), 0 2px 8px rgba(0,0,0,0.08)',
        padding: '14px 16px',
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: TEXT }}>Glow Salon</div>
          <div style={{ fontSize: 10, color: MUTED }}>Today</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: CHIP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12 }}>💄</span>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { label: 'ZMW 4,500', bg: CHIP, color: PRIMARY },
          { label: '8 bookings', bg: '#FEF3C7', color: '#92400E' },
          { label: '2 AI recovered', bg: '#DCFCE7', color: '#166534' },
        ].map(({ label, bg, color }) => (
          <span key={label} style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 20, background: bg, color }}>
            {label}
          </span>
        ))}
      </div>

      {/* Appointments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <div style={{ background: CREAM, borderRadius: 10, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT }}>Box Braids</div>
            <div style={{ fontSize: 9, color: MUTED }}>Alice · 9:00am</div>
          </div>
          <span style={{ fontSize: 9, background: '#DCFCE7', color: '#166534', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>Confirmed</span>
        </div>
        <div style={{ background: CREAM, borderRadius: 10, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT }}>Nail Set</div>
            <div style={{ fontSize: 9, color: MUTED }}>Grace · 11:00am</div>
          </div>
          <span style={{ fontSize: 9, background: CHIP, color: PRIMARY, padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>Deposit paid</span>
        </div>
      </div>

      {/* AI activity */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10 }}>✓</span>
        <span style={{ fontSize: 9, color: MUTED }}>Booked via chat · <span style={{ color: PRIMARY, fontWeight: 600 }}>2 min ago</span></span>
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-white px-6 pt-16 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left — copy */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
              style={{ color: TEXT }}
            >
              Grow Your Beauty<br className="hidden lg:block" /> Business with AI.
            </h1>

            <p className="text-base lg:text-lg leading-relaxed mb-4 max-w-md mx-auto lg:mx-0" style={{ color: MUTED }}>
              The all-in-one booking platform for beauty and wellness professionals across Zambia. Automate your bookings, delight your customers.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
              {['Hair', 'Nails', 'Barbers', 'Spa & Facial', '+ more'].map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: CHIP, color: PRIMARY }}
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-5">
              <a
                href="/signup"
                className="px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg transition-opacity hover:opacity-90 w-full sm:w-auto text-center"
                style={{ backgroundColor: PRIMARY }}
              >
                List Your Business Free
              </a>
              <a
                href="/how-it-works"
                className="px-8 py-3.5 rounded-full font-semibold text-base border-2 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                <Play size={15} fill="currentColor" />
                See How it Works
              </a>
            </div>

            <p className="text-xs" style={{ color: MUTED }}>
              No credit card needed · Free to get started
            </p>
          </div>

          {/* Right — visual mockup */}
          <div className="relative flex-shrink-0" style={{ width: 380, height: 480 }}>
            {/* Blob background */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 360,
                height: 360,
                borderRadius: '60% 40% 55% 45% / 45% 55% 45% 55%',
                background: PRIMARY,
                opacity: 0.06,
                zIndex: 0,
              }}
            />

            {/* Dashboard card — behind, tilted right */}
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 0,
                transform: 'rotate(3deg)',
                zIndex: 1,
              }}
            >
              <DashboardCard />
            </div>

            {/* Phone — front, tilted left */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 0,
                transform: 'rotate(-3deg)',
                zIndex: 2,
              }}
            >
              <PhoneMockup />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="bg-white py-12 px-6 border-b" style={{ borderColor: BORDER }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 divide-x" style={{ divideColor: BORDER }}>
          {STATS.map(({ value, label }) => (
            <div key={value} className="text-center px-6">
              <p className="font-display text-3xl md:text-4xl font-bold mb-1" style={{ color: PRIMARY }}>
                {value}
              </p>
              <p className="text-sm" style={{ color: MUTED }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-4"
            style={{ color: TEXT }}
          >
            Precision Tools for Beauty Professionals
          </h2>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
            Focus on your craft while our intelligent platform handles your bookings, reminders, and
            business insights automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-8" style={{ backgroundColor: CREAM }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: CHIP }}
            >
              <CalendarDays size={22} style={{ color: PRIMARY }} />
            </div>
            <h3 className="font-display text-xl font-bold mb-3" style={{ color: TEXT }}>
              Smart Scheduling
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Your calendar manages itself. Automatic reminders, no-show detection, and deposit
              collection keep your schedule running smoothly.
            </p>
          </div>

          <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: DARK_CARD }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <BarChart3 size={22} className="text-white" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3">Business Insights</h3>
            <p className="text-sm leading-relaxed" style={{ opacity: 0.8 }}>
              See your revenue, top services and customer activity at a glance — all in Zambian Kwacha.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Salon card (preview) ──────────────────────────────────────────────────────
function SalonCard({ salon, index }) {
  const img       = salon.coverImageUrl || salon.portfolioPreviewUrl || SALON_IMAGES[index % SALON_IMAGES.length]
  const typeLabel = TYPE_LABELS[salon.businessType] ?? salon.businessType
  const services  = TYPE_SERVICES[salon.businessType] ?? ['Booking', 'Services', 'Packages']

  return (
    <a
      href={getSalonUrl(salon.subdomain)}
      className="group block rounded-2xl overflow-hidden bg-white transition-all hover:shadow-xl"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="relative overflow-hidden" style={{ paddingBottom: '60%' }}>
        <img
          src={img}
          alt={salon.businessName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }}
        />
        <div className="absolute bottom-3 left-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: 'rgba(107,39,55,0.88)', backdropFilter: 'blur(4px)' }}
          >
            {salon.businessName}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: CHIP, color: PRIMARY }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        {salon.city && (
          <p className="flex items-center gap-1 text-xs mb-3" style={{ color: MUTED }}>
            <MapPin size={11} />
            {[salon.city, salon.area, salon.address].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {services.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: CREAM_ALT, color: TEXT }}
            >
              {s}
            </span>
          ))}
        </div>
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-1 text-xs" style={{ color: MUTED }}>
            <Star size={12} fill="#f59e0b" stroke="none" />
            <span className="font-medium text-amber-500">4.8</span>
            <span style={{ color: MUTED }}>(12)</span>
          </div>
          <span className="text-sm font-semibold transition-colors" style={{ color: PRIMARY }}>
            Book Now →
          </span>
        </div>
      </div>
    </a>
  )
}

// ── Directory preview ─────────────────────────────────────────────────────────
function DirectoryPreview() {
  const { data, loading } = useQuery(ALL_SALONS, { client: publicClient })
  const salons = (data?.salons ?? []).filter((s) => s.isActive).slice(0, 3)

  return (
    <section style={{ backgroundColor: CREAM_ALT }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2" style={{ color: TEXT }}>
              Businesses already on Kimawa
            </h2>
            <p className="text-sm" style={{ color: MUTED }}>
              Join beauty professionals across Zambia growing their business with AI.
            </p>
          </div>
          <a
            href="/discover"
            className="text-sm font-semibold hidden sm:block transition-opacity hover:opacity-70"
            style={{ color: PRIMARY }}
          >
            Explore All →
          </a>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-white animate-pulse" style={{ height: 280 }} />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: MUTED }}>
            Be the first beauty professional in Zambia on Kimawa
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {salons.map((salon, i) => (
              <SalonCard key={salon.id} salon={salon} index={i} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <a
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 transition-colors hover:bg-white"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
          >
            Browse All Beauty Professionals →
          </a>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function BottomCTA() {
  return (
    <section style={{ backgroundColor: DARK_CARD }} className="py-20 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
          Get Started for Free
        </h2>
        <p className="text-base mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Free to list your business while we launch. Paid plans coming later.
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
          {['Free to get started', 'No credit card needed', 'Full access from day one'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: CHIP }}>
              <Check size={14} />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="/signup"
          className="inline-block px-10 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: CHIP, color: PRIMARY }}
        >
          List Your Business Free
        </a>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonDirectory() {
  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />
      <Hero />
      <Stats />
      <Features />
      <DirectoryPreview />
      <BottomCTA />
      <LandingFooter />
    </div>
  )
}
