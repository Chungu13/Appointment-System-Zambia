import { MapPin } from 'lucide-react'
import { getSalonUrl } from '../../lib/utils'

const PRIMARY = '#6B2737'
const BORDER  = '#f0ece8'

const TYPE_LABELS = {
  salon:         'Salon',
  barbershop:    'Barbershop',
  nail_tech:     'Nail Tech',
  spa:           'Spa',
  lash_studio:   'Lash Studio',
  makeup_artist: 'Makeup Artist',
}


function gradientFor(name) {
  const hues = [340, 320, 350, 330, 345, 315]
  const i = (name.charCodeAt(0) || 0) % hues.length
  return `linear-gradient(135deg, hsl(${hues[i]}, 28%, 22%), hsl(${hues[i]}, 22%, 14%))`
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SalonCard({ salon, placeholder = false }) {
  if (placeholder) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: `0.5px dashed #ddd`,
          height: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#faf8f6',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#666', fontWeight: 400 }}>
          Your business could be here
        </p>
        <a
          href="/signup"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: PRIMARY, textDecoration: 'underline', letterSpacing: '0.04em' }}
        >
          List free
        </a>
      </div>
    )
  }

  const hasImage = !!(salon.coverImageUrl || salon.portfolioPreviewUrl)
  const imgSrc   = salon.coverImageUrl || salon.portfolioPreviewUrl
  const typeLabel = TYPE_LABELS[salon.businessType] ?? salon.businessType

  return (
    <a
      href={getSalonUrl(salon.subdomain)}
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, border: `0.5px solid ${BORDER}`, overflow: 'hidden', backgroundColor: '#fff', transition: 'box-shadow 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Photo — 260px */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {hasImage ? (
          <img
            src={imgSrc}
            alt={salon.businessName}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: gradientFor(salon.businessName), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 52, fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>
              {initials(salon.businessName)}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }} />
        {/* Business type badge — top left */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          backgroundColor: 'rgba(255,255,255,0.92)',
          fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
          color: '#1a1a1a', padding: '4px 10px', borderRadius: 3,
        }}>
          {typeLabel}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '0 0 6px', lineHeight: 1.3 }}>
          {salon.businessName}
        </p>
        {salon.city && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#666', fontWeight: 300, margin: '0 0 10px' }}>
            <MapPin size={11} style={{ flexShrink: 0 }} />
            {[salon.city, salon.area].filter(Boolean).join(', ')}
          </p>
        )}
        {/* Footer */}
        <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: PRIMARY, letterSpacing: '0.02em' }}>
            Book Now
          </span>
        </div>
      </div>
    </a>
  )
}
