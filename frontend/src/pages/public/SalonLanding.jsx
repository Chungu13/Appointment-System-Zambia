import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { MapPin, Phone, Clock, MessageCircle, X, Calendar, ChevronRight, ChevronLeft } from 'lucide-react'
import { SALON_PROFILE } from '../../graphql/queries/salons'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ChatWindow from '../../components/chat/ChatWindow'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatZMW } from '../../lib/utils'
import { playPopSound } from '../../lib/sounds'

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

const PREVIEW_USER = 'I want gel nails this Friday afternoon'
const PREVIEW_AGENT = 'I found 3 slots with Natasha on Friday! 2pm, 3:30pm or 5pm — which works?'

function ChatPreview() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const ids = []
    function cycle() {
      setPhase(0)
      ids.push(setTimeout(() => setPhase(1), 600))
      ids.push(setTimeout(() => setPhase(2), 1900))
      ids.push(setTimeout(() => setPhase(3), 3400))
      ids.push(setTimeout(cycle, 6500))
    }
    cycle()
    return () => ids.forEach(clearTimeout)
  }, [])

  return (
    <div className="hidden sm:block mt-7">
      <p className="text-xs text-white/70 mb-2.5 font-medium tracking-wide">✦ See how easy it is</p>
      <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-4 space-y-2 max-w-xs" style={{ minHeight: 96 }}>
        {phase >= 1 && (
          <div className="flex justify-end">
            <div className="bg-white/90 text-primary rounded-2xl rounded-br-sm px-3 py-2 text-xs font-medium max-w-[85%]">
              {PREVIEW_USER}
            </div>
          </div>
        )}
        {phase === 2 && (
          <div className="flex justify-start">
            <div className="bg-white/20 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        {phase >= 3 && (
          <div className="flex justify-start">
            <div className="bg-white/20 text-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs max-w-[85%] leading-relaxed">
              {PREVIEW_AGENT}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StaffInitials({ name, size = 'md' }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-14 h-14 text-base'
  return (
    <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shrink-0`}>
      {initials}
    </div>
  )
}

function TeamSection({ staff }) {
  const publicStaff = staff.filter((s) => s.displayOnPublicPage)
  if (publicStaff.length === 0) return null

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Meet Our Team</h2>
        <p className="text-on-surface-variant text-sm mt-1">Book with a specific stylist you trust</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {publicStaff.map((member) => (
          <div
            key={member.id}
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col gap-4"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-outline-variant shrink-0"
                />
              ) : (
                <StaffInitials name={member.fullName} />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-on-surface">{member.fullName}</p>
                {member.serviceNames?.length > 0 && (
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                    {member.serviceNames.join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {member.bio}
              </p>
            )}

            {/* Book CTA */}
            <Link
              to={`/book?staffId=${member.id}`}
              className="mt-auto inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-primary text-primary text-sm font-semibold py-2.5 hover:bg-primary hover:text-on-primary transition-colors"
            >
              Book with {member.fullName.split(' ')[0]}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const img = images[idx]

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X size={24} />
      </button>

      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1) }}
          className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1) }}
          className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={28} />
        </button>
      )}

      <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={img.imageUrl} alt={img.caption || ''} className="w-full max-h-[80vh] object-contain rounded-xl" />
        {(img.caption || img.serviceName) && (
          <div className="mt-3 text-center">
            {img.caption && <p className="text-white font-medium">{img.caption}</p>}
            {img.serviceName && <p className="text-white/60 text-sm mt-0.5">{img.serviceName}</p>}
          </div>
        )}
        <p className="text-white/40 text-xs text-center mt-2">{idx + 1} / {images.length}</p>
      </div>
    </div>
  )
}

const GALLERY_LIMIT = 6

function PortfolioGallery({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [showAll, setShowAll] = useState(false)

  if (!images || images.length === 0) return null

  const visible = showAll ? images : images.slice(0, GALLERY_LIMIT)
  const hasMore = images.length > GALLERY_LIMIT

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Our Work</h2>
        <p className="text-on-surface-variant text-sm mt-1">See what we can do for you</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((img, i) => (
          <div
            key={img.id}
            className="aspect-square cursor-pointer group relative rounded-2xl overflow-hidden border border-outline-variant"
            onClick={() => setLightboxIdx(i)}
          >
            <img
              src={img.imageUrl}
              alt={img.caption || 'Portfolio'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {(img.caption || img.serviceName) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {img.caption && <p className="text-white text-sm font-medium">{img.caption}</p>}
                {img.serviceName && <p className="text-white/75 text-xs">{img.serviceName}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
          >
            See More Work →
          </button>
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox
          images={showAll ? images : visible}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  )
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

  if (!profile.onboardingCompleted) {
    const homeUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
      ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}`
      : '/'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-sm">
          <Calendar size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>{profile.businessName}</h1>
          <p className="mb-6" style={{ color: '#6b7280' }}>We're getting ready to take bookings. Check back soon.</p>
          <a href={homeUrl} className="text-sm font-medium" style={{ color: '#6B2737' }}>← Back to Kimawa</a>
        </div>
      </div>
    )
  }

  const openToday = profile.openingHours.find((h) => {
    const today = new Date().getDay()
    const todayIdx = today === 0 ? 6 : today - 1
    return h.dayOfWeek === todayIdx && !h.isClosed
  })

  const bannerUrl = bannerFor(profile)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Background image */}
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark green overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(74, 26, 37, 0.65)' }}
        />
        {/* Bottom fade into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--color-background, #fafaf8))' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
          {/* Badge + name + meta */}
          <span className="inline-flex items-center self-start bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
            {TYPE_LABELS[profile.businessType] ?? profile.businessType}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow">
            {profile.businessName}
          </h1>
          <div className="flex flex-wrap gap-4 text-white/85 text-sm">
            {profile.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {[profile.city, profile.area, profile.address].filter(Boolean).join(' · ')}
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

          {/* Dual CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {/* Ask or Book */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-base px-6 py-3 bg-white text-primary hover:bg-white/90 shadow-lg transition-colors"
              >
                <MessageCircle size={18} />
                Ask or Book
                <ChevronRight size={16} />
              </button>
              <span className="text-xs text-white/70 text-center sm:text-left pl-1">
                Just type what you want
              </span>
            </div>

            {/* Browse & Book */}
            <div className="flex flex-col gap-1">
              <Link to="/book">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-base px-6 py-3 bg-transparent text-white border-2 border-white/70 hover:bg-white/10 shadow transition-colors">
                  <Calendar size={18} />
                  Browse &amp; Book
                </button>
              </Link>
              <span className="text-xs text-white/70 text-center sm:text-left pl-1">
                Pick a service and time
              </span>
            </div>
          </div>

          {/* Animated chat preview */}
          <ChatPreview />
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

        {/* Team */}
        <TeamSection staff={profile.staff} />

        {/* Portfolio */}
        <PortfolioGallery images={profile.portfolioImages} />

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
          Kimawa
        </a>
      </footer>

      {/* Chat FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {!chatOpen && (
          <span className="bg-white text-on-surface font-semibold text-sm px-3 py-1.5 rounded-full shadow-md select-none">
            Ask or Book
          </span>
        )}
        <div className="relative">
          {!chatOpen && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: '#6B2737' }}
            />
          )}
          <button
            onClick={() => { playPopSound(); setChatOpen((v) => !v) }}
            className="relative w-16 h-16 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
            style={{ background: '#4A1A25' }}
            title="Chat with booking assistant"
          >
            {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          </button>
        </div>
      </div>

      {chatOpen && (
        <ChatWindow
          customerPhone="+260000000000"
          salonName={profile.businessName}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
