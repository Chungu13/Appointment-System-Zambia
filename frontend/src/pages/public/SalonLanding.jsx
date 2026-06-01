import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { MapPin, Phone, Calendar, Menu, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { SALON_PROFILE } from '../../graphql/queries/salons'
import ChatWindow from '../../components/chat/ChatWindow'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatZMW } from '../../lib/utils'
import { playPopSound } from '../../lib/sounds'

const PRIMARY   = '#6B2737'
const DARK      = '#1A0A0D'
const BORDER    = '#f0ece8'
const serif     = 'Inter, sans-serif'
const sans      = 'Inter, sans-serif'

const TYPE_LABELS = {
  salon:         'Salon',
  barbershop:    'Barbershop',
  nail_tech:     'Nail Tech',
  spa:           'Spa',
  lash_studio:   'Lash Studio',
  makeup_artist: 'Makeup Artist',
}

const DEFAULT_BANNERS = {
  salon:        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80',
  nail_tech:    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=80',
  barbershop:   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=80',
  spa:          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=80',
  lash_studio:  'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=1400&q=80',
  _fallback:    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80',
}

function bannerFor(profile) {
  if (profile.coverImageUrl) return profile.coverImageUrl
  if (profile.portfolioPreviewUrl) return profile.portfolioPreviewUrl
  return DEFAULT_BANNERS[profile.businessType] ?? DEFAULT_BANNERS._fallback
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Eyebrow ───────────────────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555', margin: '0 0 16px' }}>
      {children}
    </p>
  )
}

// ─��� Navbar ──────────────────────────���────────────────────────────────��────────
function SalonNav() {
  const [open, setOpen] = useState(false)
  const homeUrl    = import.meta.env.VITE_TENANT_APP_DOMAIN ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}` : '/'
  const discoverUrl = import.meta.env.VITE_TENANT_APP_DOMAIN ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}/discover` : '/discover'

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff', borderBottom: `0.5px solid ${BORDER}` }}>
      {/* Desktop bar */}
      <div className="hidden sm:flex" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 64px', height: 56, alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={homeUrl} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Kimawa</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href={discoverUrl} style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#888', textDecoration: 'none' }}>
            Find Beauty Services
          </a>
          <a href={discoverUrl} style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '9px 20px', borderRadius: 3, textDecoration: 'none' }}>
            Browse &amp; Book
          </a>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="flex sm:hidden" style={{ padding: '0 20px', height: 56, alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={homeUrl} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: '#1a1a1a' }}>Kimawa</span>
        </a>
        <button onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 12, color: '#1a1a1a' }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fff', padding: '8px 4px' }}>
          <a href={discoverUrl} onClick={() => setOpen(false)} style={{ fontSize: 14, color: '#333', textDecoration: 'none', padding: '14px 16px', display: 'block' }}>
            Find Beauty Services
          </a>
          <div style={{ padding: '8px 16px' }}>
            <a href={discoverUrl} onClick={() => setOpen(false)} style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '14px 20px', borderRadius: 3, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Browse &amp; Book
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ profile, onChatOpen }) {
  const bannerUrl = bannerFor(profile)
  const openToday = profile.openingHours.find((h) => {
    const today = new Date().getDay()
    const todayIdx = today === 0 ? 6 : today - 1
    return h.dayOfWeek === todayIdx && !h.isClosed
  })

  return (
    <header className="salon-hero" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <img src={bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundColor: DARK }} />
      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to top, rgba(10,3,5,0.9), transparent)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }} className="px-16 max-sm:px-5 max-sm:pb-8">
        {/* Business type badge */}
        <span style={{ display: 'inline-block', alignSelf: 'flex-start', fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 3, marginBottom: 12 }}>
          {TYPE_LABELS[profile.businessType] ?? profile.businessType}
        </span>

        <h1 className="salon-hero-name" style={{ fontFamily: serif, fontWeight: 300, letterSpacing: '-1px', color: '#fff', margin: '0 0 14px', lineHeight: 1.05 }}>
          {profile.businessName}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          {profile.city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>
              <MapPin size={13} />
              {[profile.city, profile.area, profile.address].filter(Boolean).join(', ')}
            </span>
          )}
          {profile.phone && (
            <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>
              <Phone size={13} />
              {profile.phone}
            </a>
          )}
          {openToday && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
              Open now · closes {formatTime(openToday.closesAt)}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

// ── AI Bar ────────────────────────────────────────────────────────────────────
const SUGGESTION_CHIPS = [
  'What services do you offer?',
  'Book a service this Saturday',
  'How much are your services?',
  'What times are available?',
]

function AIBar({ salonName, onOpen, onChipClick }) {
  const [input, setInput] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim()) { onOpen(input.trim()); setInput('') }
  }

  return (
    <section style={{ backgroundColor: DARK }}>
      <div className="salon-ai-bar" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Label */}
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.8)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIMARY, display: 'inline-block' }} />
          AI BOOKING ASSISTANT — ONLINE NOW
        </p>

        {/* Input row */}
        <form onSubmit={handleSubmit} className="salon-ai-input-row">
          <div style={{ flex: 1, position: 'relative' }}>
            <Sparkles size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: PRIMARY, pointerEvents: 'none' }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like today? e.g. I want gel nails this Saturday"
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: sans, fontSize: 13, fontWeight: 300, color: '#fff', backgroundColor: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '13px 16px 13px 40px', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '13px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Ask or Book
          </button>
        </form>

        {/* Suggestion chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 3, padding: '6px 12px', cursor: 'pointer' }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ profile, onBook }) {
  const minPrice = profile.services.length
    ? Math.min(...profile.services.filter((s) => s.priceZmw > 0).map((s) => s.priceZmw))
    : null

  const stats = [
    { label: 'Services', value: profile.services.length },
    { label: 'Team members', value: profile.staffCount },
    ...(minPrice ? [{ label: 'Starting from', value: formatZMW(minPrice) }] : []),
  ]

  return (
    <section style={{ backgroundColor: '#faf8f6', borderBottom: `0.5px solid ${BORDER}` }}>
      <div className="salon-stats-bar" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {stats.map(({ label, value }, i) => (
            <div key={label} style={{ paddingRight: 28, paddingLeft: i > 0 ? 28 : 0, borderLeft: i > 0 ? `0.5px solid ${BORDER}` : 'none' }}>
              <p style={{ fontFamily: sans, fontSize: 20, fontWeight: 500, color: '#1a1a1a', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#666', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
        <Link
          to="/book"
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: '#888', border: `0.5px solid #ddd`, padding: '9px 20px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.04em', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          Browse &amp; Book →
        </Link>
      </div>
    </section>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
function ServicesSection({ services, onBook }) {
  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Services'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  if (services.length === 0) return null

  return (
    <section>
      <Eyebrow>Services</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Category header */}
            <div style={{ padding: '10px 16px', borderBottom: `0.5px solid ${BORDER}`, backgroundColor: '#faf8f6' }}>
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', margin: 0 }}>{cat}</p>
            </div>
            {/* Service rows */}
            {items.map((svc, i) => (
              <div
                key={svc.id}
                className="service-item"
                style={{ borderTop: i > 0 ? `0.5px solid ${BORDER}` : 'none' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#1a1a1a', margin: '0 0 3px' }}>{svc.name}</p>
                  <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#666', margin: 0 }}>
                    {svc.durationMinutes} min
                    {svc.depositZmw > 0 && ` · ${formatZMW(svc.depositZmw)} deposit`}
                  </p>
                </div>
                <div className="service-item-right">
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{formatZMW(svc.priceZmw)}</p>
                  <button
                    onClick={() => onBook(`I want to book ${svc.name}`)}
                    style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', letterSpacing: '0.04em' }}
                  >
                    Book →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const img = images[idx]

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1))
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={20} />
      </button>
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1) }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1) }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={22} />
        </button>
      )}
      <div style={{ maxWidth: 800, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <img src={img.imageUrl} alt={img.caption || ''} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }} />
        {img.caption && <p style={{ color: '#fff', textAlign: 'center', fontFamily: sans, fontSize: 13, marginTop: 12 }}>{img.caption}</p>}
      </div>
    </div>
  )
}

function PortfolioSection({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  if (!images || images.length === 0) {
    return (
      <section>
        <Eyebrow>Portfolio</Eyebrow>
        <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>No portfolio photos yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <Eyebrow>Portfolio</Eyebrow>
      {/* 2-col on mobile, 3-col on desktop; first image spans 2 rows on desktop only */}
      <div className="salon-portfolio-grid">
        {images.slice(0, 7).map((img, i) => (
          <div
            key={img.id}
            onClick={() => setLightboxIdx(i)}
            className={i === 0 ? 'h-40 sm:h-[288px] sm:row-span-2' : 'h-36 sm:h-[140px]'}
            style={{ borderRadius: 6, overflow: 'hidden', cursor: 'pointer' }}
          >
            <img
              src={img.imageUrl}
              alt={img.caption || 'Portfolio'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            />
          </div>
        ))}
      </div>
      {lightboxIdx !== null && (
        <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </section>
  )
}

// ── Team ──────────────────────────────────────────────────────────────────────
function TeamSection({ staff }) {
  const publicStaff = staff.filter((s) => s.displayOnPublicPage)
  if (publicStaff.length === 0) return null

  return (
    <section>
      <Eyebrow>Meet the team</Eyebrow>
      <div className="salon-team-grid">
        {publicStaff.map((member) => (
          <div key={member.id} style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 18, textAlign: 'center' }}>
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.fullName} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f5eaec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 500, color: PRIMARY }}>{initials(member.fullName)}</span>
              </div>
            )}
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 4px' }}>{member.fullName}</p>
            {member.serviceNames?.length > 0 && (
              <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: '#666', margin: 0, lineHeight: 1.5 }}>
                {member.serviceNames.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Hours ─────────────────────────────────────────────────────────────────────
function HoursCard({ hours }) {
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()
  const todayRow = hours.find((h) => h.dayOfWeek === todayIdx)
  const isOpenNow = todayRow && !todayRow.isClosed

  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>Opening hours</p>
        {isOpenNow && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: sans, fontSize: 11, fontWeight: 500, color: '#16a34a' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
            Open now
          </span>
        )}
      </div>
      <div>
        {hours.map((h) => {
          const isToday = h.dayOfWeek === todayIdx
          return (
            <div
              key={h.dayOfWeek}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', backgroundColor: isToday ? '#fdf8f8' : 'transparent', borderBottom: `0.5px solid ${BORDER}` }}
            >
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: isToday ? 500 : 400, color: isToday ? '#1a1a1a' : '#555' }}>{h.dayName}</span>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: h.isClosed ? '#999' : '#1a1a1a' }}>
                {h.isClosed ? 'Closed' : `${formatTime(h.opensAt)} – ${formatTime(h.closesAt)}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Location ──────────────────────────────────────────────────────────────────
function LocationCard({ profile }) {
  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
      <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 10px' }}>Location</p>
      {profile.area && <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#555', margin: '0 0 4px' }}>{profile.area}</p>}
      {profile.address && <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#555', margin: '0 0 4px' }}>{profile.address}</p>}
      {profile.city && <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#555', margin: 0 }}>{profile.city}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonLanding() {
  const [chatOpen,      setChatOpen]      = useState(false)
  const [chatInitMsg,   setChatInitMsg]   = useState('')
  const { data, loading, error } = useQuery(SALON_PROFILE)

  if (loading) return <PageSpinner />
  if (error)   return <ErrorMessage message={error.message} />

  const profile = data?.salonProfile
  if (!profile) return null

  if (!profile.onboardingCompleted) {
    const homeUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
      ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}`
      : '/'
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', backgroundColor: '#faf8f6' }}>
        <Calendar size={48} style={{ color: '#ddd', marginBottom: 16 }} />
        <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: '#1a1a1a', margin: '0 0 8px' }}>{profile.businessName}</h1>
        <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 300, color: '#666', margin: '0 0 24px' }}>We're getting ready to take bookings. Check back soon.</p>
        <a href={homeUrl} style={{ fontFamily: sans, fontSize: 13, color: PRIMARY, textDecoration: 'none' }}>← Back to Kimawa</a>
      </div>
    )
  }

  function openChat(msg = '') {
    setChatInitMsg(msg)
    playPopSound()
    setChatOpen(true)
  }

  return (
    <div style={{ backgroundColor: '#fff' }}>
      <style>{`
        .salon-hero { height: 400px; }
        .salon-hero-name { font-size: 52px; }
        .salon-ai-bar { padding: 28px 64px; }
        .salon-ai-input-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .salon-stats-bar { padding: 18px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .salon-content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 56px; padding: 56px 64px; }
        .salon-portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .salon-team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .service-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 16px; }
        .service-item-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .salon-hero { height: 260px !important; }
          .salon-hero-name { font-size: 28px !important; }
          .salon-ai-bar { padding: 16px !important; }
          .salon-ai-input-row { flex-direction: column !important; }
          .salon-stats-bar { padding: 12px 16px !important; }
          .salon-content-grid { grid-template-columns: 1fr !important; gap: 24px !important; padding: 16px !important; }
          .salon-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .salon-team-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .service-item { flex-wrap: wrap; gap: 8px !important; }
          .service-item-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
      <SalonNav />
      <Hero profile={profile} onChatOpen={openChat} />
      <AIBar salonName={profile.businessName} onOpen={openChat} onChipClick={openChat} />
      <StatsBar profile={profile} />

      {/* Main content + sidebar */}
      <div className="salon-content-grid" style={{ maxWidth: 1200, margin: '0 auto', alignItems: 'start' }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          <ServicesSection services={profile.services.filter((s) => s.isActive)} onBook={openChat} />
          <PortfolioSection images={profile.portfolioImages} />
          <TeamSection staff={profile.staff} />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <HoursCard hours={profile.openingHours} />
          <LocationCard profile={profile} />
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 20, paddingBottom: 20, textAlign: 'center' }} className="px-16 max-sm:px-5">
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: '#666', margin: 0 }}>
          {profile.businessName} &middot; Powered by{' '}
          <a href={import.meta.env.VITE_TENANT_APP_DOMAIN ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}` : '/'} style={{ color: PRIMARY, textDecoration: 'none' }}>Kimawa</a>
        </p>
      </footer>

      {/* Chat FAB */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 40 }}>
        <button
          onClick={() => { chatOpen ? setChatOpen(false) : openChat('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: chatOpen ? '11px 18px' : '11px 22px',
            backgroundColor: DARK,
            border: '0.5px solid rgba(255,255,255,0.14)',
            borderRadius: 40,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            fontFamily: sans, fontSize: 13, fontWeight: 500,
            letterSpacing: '0.02em',
            transition: 'padding 0.15s',
          }}
        >
          {chatOpen
            ? <><X size={15} style={{ opacity: 0.7 }} /><span>Close</span></>
            : <><Sparkles size={14} style={{ color: PRIMARY }} /><span>Ask or Book</span></>
          }
        </button>
      </div>

      {chatOpen && (
        <ChatWindow
          customerPhone="+260000000000"
          salonName={profile.businessName}
          initialMessage={chatInitMsg}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
