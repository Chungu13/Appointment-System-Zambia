import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { Search, MapPin } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import SalonCard from '../../components/salon/SalonCard'

const PRIMARY = '#6B2737'
const BORDER  = '#f0ece8'
const serif   = 'Inter, sans-serif'
const sans    = 'Inter, sans-serif'

const CATEGORIES = [
  { value: 'all',           label: 'All' },
  { value: 'salon',         label: 'Salons' },
  { value: 'barbershop',    label: 'Barbershops' },
  { value: 'nail_tech',     label: 'Nail Techs' },
  { value: 'spa',           label: 'Spas' },
  { value: 'lash_studio',   label: 'Lash Studios' },
  { value: 'makeup_artist', label: 'Makeup Artists' },
]

const FILTER_CITIES = ['All Cities', ...CITIES.filter((c) => c !== 'Other')]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, border: `0.5px solid ${BORDER}`, overflow: 'hidden', backgroundColor: '#fff' }}>
      <div style={{ height: 260, backgroundColor: '#f5f5f5' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ height: 14, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 8, width: '60%' }} />
        <div style={{ height: 11, backgroundColor: '#f5f5f5', borderRadius: 3, width: '40%' }} />
      </div>
    </div>
  )
}

export default function Directory() {
  const [search,   setSearch]   = useState('')
  const [area,     setArea]     = useState('')
  const [city,     setCity]     = useState('All Cities')
  const [category, setCategory] = useState('all')

  const { data, loading } = useQuery(ALL_SALONS, { client: publicClient })

  const salons = useMemo(() => {
    let list = (data?.salons ?? []).filter((s) => s.isActive)
    if (city !== 'All Cities') list = list.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
    if (category !== 'all')    list = list.filter((s) => s.businessType === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.businessName.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q))
    }
    if (area.trim() && area !== 'All Areas') {
      list = list.filter((s) => s.area?.toLowerCase().includes(area.toLowerCase()))
    }
    return list
  }, [data, city, category, search, area])

  return (
    <div style={{ backgroundColor: '#fff' }}>
      <LandingNav />

      {/* Search hero */}
      <section style={{ padding: '64px 64px 48px', borderBottom: `0.5px solid ${BORDER}` }} className="max-sm:px-5 max-sm:pt-10 max-sm:pb-8">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 16px' }}>
            Beauty marketplace · Zambia
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1.08, color: '#1a1a1a', margin: '0 0 16px' }} className="max-sm:text-3xl">
            Find Your Perfect{' '}
            <em style={{ color: PRIMARY, fontStyle: 'italic' }}>Beauty Professional</em>
          </h1>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#333', margin: '0 0 36px', maxWidth: 520 }}>
            Discover and book salons, barbershops, nail techs, spas and more across Zambia.
          </p>

          {/* Search row */}
          <div style={{ display: 'flex', gap: 12, maxWidth: 720 }} className="max-sm:flex-col">
            {/* Name/type */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#333', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or type…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#1a1a1a',
                  border: `0.5px solid #ddd`, borderRadius: 4, padding: '13px 16px 13px 38px',
                  outline: 'none', backgroundColor: '#fff',
                }}
              />
            </div>

            {/* Area */}
            <div style={{ flex: 1, position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#333', pointerEvents: 'none' }} />
              {city === 'Lusaka' ? (
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: sans, fontSize: 13, color: area ? '#1a1a1a' : '#333', border: `0.5px solid #ddd`, borderRadius: 4, padding: '13px 16px 13px 38px', outline: 'none', backgroundColor: '#fff', appearance: 'none' }}
                >
                  <option value="">All Lusaka areas…</option>
                  {LUSAKA_AREAS.filter((a) => a !== 'Other').map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area e.g. Kabulonga…"
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: sans, fontSize: 13, color: '#1a1a1a', border: `0.5px solid #ddd`, borderRadius: 4, padding: '13px 16px 13px 38px', outline: 'none', backgroundColor: '#fff' }}
                />
              )}
            </div>

            {/* Search button */}
            <button
              style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '13px 28px', borderRadius: 4, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <section style={{ padding: '16px 64px', borderBottom: `0.5px solid ${BORDER}` }} className="max-sm:px-5">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* City selector */}
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setArea('') }}
            style={{ fontFamily: sans, fontSize: 12, color: '#333', border: `0.5px solid #ddd`, borderRadius: 3, padding: '6px 12px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            {FILTER_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Category pills */}
          {CATEGORIES.map(({ value, label }) => {
            const active = category === value
            return (
              <button
                key={value}
                onClick={() => setCategory(value)}
                style={{
                  fontFamily: sans, fontSize: 12, fontWeight: active ? 500 : 400,
                  color: active ? '#fff' : '#333',
                  backgroundColor: active ? PRIMARY : 'transparent',
                  border: `0.5px solid ${active ? PRIMARY : '#ddd'}`,
                  borderRadius: 3, padding: '6px 14px', cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            )
          })}

          {/* Results count */}
          {!loading && (
            <span style={{ marginLeft: 'auto', fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333' }}>
              {salons.length} {salons.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
      </section>

      {/* Results */}
      <section style={{ padding: '40px 64px 80px', backgroundColor: '#fff' }} className="max-sm:px-5">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {!loading && salons.length > 0 && (
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#333', margin: '0 0 24px' }}>
              Showing {salons.length} {salons.length === 1 ? 'business' : 'businesses'}{city !== 'All Cities' ? ` in ${city}` : ' in Zambia'}
            </p>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : salons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Search size={32} style={{ color: '#ddd', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#1a1a1a', margin: '0 0 6px' }}>No results found</p>
              <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: '#333', margin: '0 0 24px' }}>
                Try a different city or category, or{' '}
                <a href="/signup" style={{ color: PRIMARY, textDecoration: 'underline' }}>list your business</a>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {salons.map((salon) => <SalonCard key={salon.id} salon={salon} />)}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
