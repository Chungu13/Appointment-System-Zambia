import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { MapPin, Phone, Clock, MessageCircle, X, Calendar } from 'lucide-react'
import { SALON_PROFILE } from '../../graphql/queries/salons'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ChatWindow from '../../components/chat/ChatWindow'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatZMW } from '../../lib/utils'

const TYPE_LABELS = {
  salon: 'Salon',
  barbershop: 'Barbershop',
  nail_tech: 'Nail Tech',
  spa: 'Spa',
  lash_studio: 'Lash Studio',
  makeup_artist: 'Makeup Artist',
}

const DEFAULT_BANNERS = {
  salon:        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
  nail_tech:    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80',
  barbershop:   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
  spa:          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80',
  lash_studio:  'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=1200&q=80',
  _fallback:    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
}

function bannerFor(profile) {
  if (profile.coverImageUrl) return profile.coverImageUrl
  return DEFAULT_BANNERS[profile.businessType] ?? DEFAULT_BANNERS._fallback
}

const CATEGORY_COLORS = {
  hair: 'blue',
  nails: 'purple',
  braids: 'yellow',
  colour: 'red',
  lashes: 'green',
  other: 'gray',
}

function ServiceGrid({ services }) {
  const grouped = services.reduce((acc, s) => {
    const cat = s.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center gap-3 mb-4">
            <Badge color={CATEGORY_COLORS[category] ?? 'gray'} className="capitalize">
              {category}
            </Badge>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((service) => (
              <div
                key={service.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-on-surface text-sm leading-snug">{service.name}</p>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {formatZMW(service.priceZmw)}
                  </span>
                </div>
                {service.description && (
                  <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Clock size={11} />
                  {service.durationMinutes} min
                  {service.depositZmw > 0 && (
                    <span className="ml-2 text-on-surface-variant/70">
                      · {formatZMW(service.depositZmw)} deposit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HoursTable({ hours }) {
  const today = new Date().getDay()
  // JS getDay(): 0=Sun, but our day_of_week: 0=Mon — shift
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div className="divide-y divide-outline-variant">
      {hours.map((h) => (
        <div
          key={h.dayOfWeek}
          className={`flex justify-between py-2.5 text-sm ${
            h.dayOfWeek === todayIdx ? 'font-semibold text-primary' : 'text-on-surface'
          }`}
        >
          <span>{h.dayName}</span>
          <span className={h.isClosed ? 'text-on-surface-variant' : ''}>
            {h.isClosed
              ? 'Closed'
              : `${formatTime(h.opensAt)} – ${formatTime(h.closesAt)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function SalonLanding() {
  const [chatOpen, setChatOpen] = useState(false)
  const { data, loading, error } = useQuery(SALON_PROFILE)

  if (loading) return <PageSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const profile = data?.salonProfile
  if (!profile) return null

  const openToday = profile.openingHours.find((h) => {
    const today = new Date().getDay()
    const todayIdx = today === 0 ? 6 : today - 1
    return h.dayOfWeek === todayIdx && !h.isClosed
  })

  const bannerUrl = bannerFor(profile)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative w-full h-60 sm:h-80 overflow-hidden">
        {/* Background image */}
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark green overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(26, 58, 42, 0.65)' }}
        />
        {/* Bottom fade into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--color-background, #fafaf8))' }}
        />

        {/* Content */}
        <div className="relative z-10 h-full max-w-4xl mx-auto px-4 flex flex-col justify-end pb-8">
          <span className="inline-flex items-center self-start bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
            {TYPE_LABELS[profile.businessType] ?? profile.businessType}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow">
            {profile.businessName}
          </h1>
          <div className="flex flex-wrap gap-4 text-white/85 text-sm">
            {profile.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {profile.city}
                {profile.address && ` · ${profile.address}`}
              </span>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone size={14} /> {profile.phone}
              </a>
            )}
            {openToday && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                Open today {formatTime(openToday.opensAt)} – {formatTime(openToday.closesAt)}
              </span>
            )}
          </div>

          <div className="mt-6">
            <Link to="/book">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Calendar size={18} />
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Services */}
        {profile.services.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold text-on-surface mb-8">
              Services & Pricing
            </h2>
            <ServiceGrid services={profile.services} />
          </section>
        )}

        {/* Hours + CTA */}
        <div className="grid sm:grid-cols-2 gap-10">
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface mb-5">
              Opening Hours
            </h2>
            <HoursTable hours={profile.openingHours} />
          </section>

          <section className="bg-primary-container rounded-2xl p-6 flex flex-col justify-center">
            <h2 className="font-display text-xl font-semibold text-on-primary-container mb-2">
              Ready to book?
            </h2>
            <p className="text-sm text-on-primary-container/80 mb-6">
              Choose a service, pick a time, and confirm your appointment in under 2 minutes.
            </p>
            <Link to="/book">
              <Button fullWidth>
                <Calendar size={16} />
                Book an Appointment
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant mt-8 py-8 text-center text-sm text-on-surface-variant">
        © {new Date().getFullYear()} {profile.businessName} · Powered by{' '}
        <a href="http://localhost:3000" className="text-primary hover:underline">
          BeautyBook ZM
        </a>
      </footer>

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        title="Chat with booking assistant"
      >
        {chatOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {chatOpen && (
        <ChatWindow
          customerPhone="+260000000000"
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
