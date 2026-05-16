import { useQuery } from '@apollo/client/react'
import { Play, CalendarDays, BarChart3, MapPin, Star, Check } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import { getSalonUrl } from '../../lib/utils'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

// ── Theme ─────────────────────────────────────────────────────────────────────
const PRIMARY   = '#3d5c40'
const DARK_CARD = '#4b6b4e'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_ALT  = '#edf6ed'
const MINT_CHIP = '#d4ecd4'

// ── Data ──────────────────────────────────────────────────────────────────────
const SALON_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'https://images.unsplash.com/photo-1582095133179-bfd08e2533cf?w=800&q=80',
]

const TYPE_LABELS = {
  salon:          'Salon',
  barbershop:     'Barbershop',
  nail_tech:      'Nail Tech',
  spa:            'Spa',
  lash_studio:    'Lash Studio',
  makeup_artist:  'Makeup Artist',
}

const TYPE_SERVICES = {
  salon:          ['Haircut', 'Colour', 'Styling'],
  barbershop:     ['Fade', 'Shape Up', 'Beard Trim'],
  nail_tech:      ['Manicure', 'Pedicure', 'Nail Art'],
  spa:            ['Massage', 'Facial', 'Body Wrap'],
  lash_studio:    ['Lash Extensions', 'Lash Lift', 'Brow Tint'],
  makeup_artist:  ['Bridal Makeup', 'Party Glam', 'Natural Look'],
}

const STATS = [
  { value: '14-day', label: 'Free trial — no card needed' },
  { value: 'ZMW', label: 'Local payments supported' },
  { value: 'Zero', label: 'Setup fees, ever' },
]

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ backgroundColor: MINT }} className="px-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
          style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
        >
          <span>✦</span>
          <span>AI-Powered Booking Management</span>
        </div>

        <h1
          className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6"
          style={{ color: TEXT }}
        >
          Grow Your Beauty Business<br className="hidden sm:block" /> with AI.
        </h1>

        <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: MUTED }}>
          The all-in-one booking platform for salons, barbershops, nail technicians, spas and lash
          studios. Automate your bookings, delight your customers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/signup"
            className="px-8 py-4 rounded-full text-white font-semibold text-base shadow-lg transition-opacity hover:opacity-90 w-full sm:w-auto text-center"
            style={{ backgroundColor: PRIMARY }}
          >
            List Your Business Free
          </a>
          <a
            href="/how-it-works"
            className="px-8 py-4 rounded-full font-semibold text-base border-2 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors hover:bg-white/50"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
          >
            <Play size={16} fill="currentColor" />
            See How it Works
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="bg-white py-12 px-6 border-b" style={{ borderColor: '#e8f0e8' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 divide-x" style={{ divideColor: '#e8f0e8' }}>
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
          <div className="rounded-2xl p-8" style={{ backgroundColor: MINT }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: MINT_CHIP }}
            >
              <CalendarDays size={22} style={{ color: PRIMARY }} />
            </div>
            <h3 className="font-display text-xl font-bold mb-3" style={{ color: TEXT }}>
              Smart Scheduling
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Your calendar fills itself. AI manages bookings, cancellations, and waitlists
              automatically.
            </p>
          </div>

          <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: DARK_CARD }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <BarChart3 size={22} className="text-white" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3">Real-time Insights</h3>
            <p className="text-sm leading-relaxed" style={{ opacity: 0.8 }}>
              See your revenue, top services, and customer trends at a glance — in plain Zambian
              Kwacha.
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
            style={{ backgroundColor: 'rgba(61,92,64,0.88)', backdropFilter: 'blur(4px)' }}
          >
            {salon.businessName}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        {salon.city && (
          <p className="flex items-center gap-1 text-xs mb-3" style={{ color: MUTED }}>
            <MapPin size={11} />
            {salon.city}
            {salon.address ? ` · ${salon.address}` : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {services.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: MINT_ALT, color: TEXT }}
            >
              {s}
            </span>
          ))}
        </div>
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid #e8f0e8' }}
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
    <section style={{ backgroundColor: MINT_ALT }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2" style={{ color: TEXT }}>
              Salons already on BeautyBook ZM
            </h2>
            <p className="text-sm" style={{ color: MUTED }}>
              Join beauty professionals across Zambia growing their business with AI.
            </p>
          </div>
          <a
            href="/directory"
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
            No salons listed yet — be the first!
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
            href="/directory"
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
          Start your 14-day free trial
        </h2>
        <p className="text-base mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
          No credit card needed. Full access from day one.
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
          {['Setup in under 10 minutes', 'No contracts', 'Cancel anytime'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: MINT_CHIP }}>
              <Check size={14} />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="/signup"
          className="inline-block px-10 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
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
