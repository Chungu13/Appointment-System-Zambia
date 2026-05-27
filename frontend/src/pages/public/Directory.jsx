import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { MapPin, Star, Search } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import { getSalonUrl } from '../../lib/utils'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

// ── Theme ─────────────────────────────────────────────────────────────────────
const PRIMARY   = '#6B2737'
const DARK_CARD = '#4A1A25'
const TEXT      = '#1A0A0D'
const MUTED     = '#6B4A50'
const CREAM     = '#FDF5F6'
const CREAM_ALT = '#FAF0F2'
const CHIP      = '#E8C4CC'
const BORDER    = '#D4B0B8'

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

const FILTER_CITIES = ['All Cities', ...CITIES.filter((c) => c !== 'Other')]

const CATEGORIES = [
  { value: 'all',          label: 'All' },
  { value: 'salon',        label: 'Salons' },
  { value: 'barbershop',   label: 'Barbershops' },
  { value: 'nail_tech',    label: 'Nail Techs' },
  { value: 'spa',          label: 'Spas' },
  { value: 'lash_studio',  label: 'Lash Studios' },
  { value: 'makeup_artist',label: 'Makeup Artists' },
]

// Stable gradient colors per initials for no-image cards
function gradientForName(name) {
  const hues = [160, 145, 170, 155, 165, 140]
  const i = (name.charCodeAt(0) || 0) % hues.length
  return `hsl(${hues[i]}, 35%, 38%)`
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="bg-gray-200" style={{ paddingBottom: '60%' }} />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
      </div>
    </div>
  )
}

// ── Salon card ────────────────────────────────────────────────────────────────
function SalonCard({ salon }) {
  const typeLabel = TYPE_LABELS[salon.businessType] ?? salon.businessType
  const services  = TYPE_SERVICES[salon.businessType] ?? ['Booking', 'Services']
  const hasImage  = !!salon.coverImageUrl

  return (
    <a
      href={getSalonUrl(salon.subdomain)}
      className="group block rounded-2xl overflow-hidden bg-white transition-all hover:shadow-xl"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Photo or gradient */}
      <div className="relative overflow-hidden" style={{ paddingBottom: '60%' }}>
        {hasImage ? (
          <img
            src={salon.coverImageUrl}
            alt={salon.businessName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: gradientForName(salon.businessName) }}
          >
            <span className="text-white font-display text-4xl font-bold opacity-40">
              {initials(salon.businessName)}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }}
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

      {/* Body */}
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
          </div>
          <span className="text-sm font-semibold" style={{ color: PRIMARY }}>
            Book Now →
          </span>
        </div>
      </div>
    </a>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Directory() {
  const [search,   setSearch]   = useState('')
  const [area,     setArea]     = useState('')
  const [city,     setCity]     = useState('All Cities')
  const [category, setCategory] = useState('all')

  const { data, loading } = useQuery(ALL_SALONS, { client: publicClient })

  const salons = useMemo(() => {
    let list = (data?.salons ?? []).filter((s) => s.isActive)

    if (city !== 'All Cities') {
      list = list.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
    }
    if (category !== 'all') {
      list = list.filter((s) => s.businessType === category)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.businessName.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          TYPE_LABELS[s.businessType]?.toLowerCase().includes(q),
      )
    }
    if (area.trim() && area !== 'All Areas') {
      const q = area.toLowerCase()
      list = list.filter((s) => s.area?.toLowerCase().includes(q))
    }
    return list
  }, [data, city, category, search, area])

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ backgroundColor: DARK_CARD }} className="py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Find Your Perfect<br className="hidden sm:block" /> Beauty Professional
          </h1>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Discover and book salons, barbershops, nail techs, spas and more across Zambia.
          </p>

          {/* Search bars */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or type…"
                className="w-full rounded-full pl-10 pr-5 py-3.5 text-sm outline-none"
                style={{ color: TEXT, backgroundColor: '#ffffff' }}
              />
            </div>
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
              {city === 'Lusaka' ? (
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-full pl-10 pr-5 py-3.5 text-sm outline-none bg-white"
                  style={{ color: area ? TEXT : '#9ca3af' }}
                >
                  <option value="">All Lusaka areas…</option>
                  {LUSAKA_AREAS.filter((a) => a !== 'Other').map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area e.g. Kabulonga, Woodlands…"
                  className="w-full rounded-full pl-10 pr-5 py-3.5 text-sm outline-none"
                  style={{ color: TEXT, backgroundColor: '#ffffff' }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section style={{ backgroundColor: CREAM }} className="px-6 pt-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {/* City dropdown */}
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setArea('') }}
              className="rounded-full border px-4 py-2 text-sm bg-white outline-none"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              {FILTER_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: category === value ? PRIMARY : '#ffffff',
                    color:           category === value ? '#ffffff' : TEXT,
                    border:          `1px solid ${category === value ? PRIMARY : BORDER}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {salons.length > 0 && !loading && (
              <p className="ml-auto text-sm" style={{ color: MUTED }}>
                {salons.length} result{salons.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : salons.length === 0 ? (
            <div
              className="rounded-2xl py-20 text-center"
              style={{ backgroundColor: '#ffffff', border: `1px solid ${BORDER}` }}
            >
              <div className="flex justify-center mb-4">
                <Search size={36} style={{ color: CHIP }} />
              </div>
              <p className="font-semibold text-base mb-1" style={{ color: TEXT }}>
                No results found
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                Try a different city or category — or{' '}
                <a href="/" className="hover:underline" style={{ color: PRIMARY }}>
                  list your business
                </a>{' '}
                here.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA for owners */}
      <section className="bg-white py-16 px-6 text-center border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-xl mx-auto">
          <p className="text-sm font-medium mb-2" style={{ color: MUTED }}>
            Are you a beauty professional?
          </p>
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: TEXT }}>
            Get your business listed for free
          </h2>
          <a
            href="/signup"
            className="inline-block px-8 py-4 rounded-full font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            List Your Business Free →
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
