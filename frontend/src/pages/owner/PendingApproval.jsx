import { useSearchParams, useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#8A7A6A'
const HINT   = '#8A7A6A'
const BORDER = '#EDE3D6'

const serif = "'Inter', sans-serif"
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const STEPS = [
  { label: 'Email verified',                                done: true  },
  { label: 'Business under review, usually within 24 hours', done: false },
  { label: 'Account activated, go live on Kimawa',           done: false },
]

export default function PendingApproval() {
  const [params]       = useSearchParams()
  const navigate       = useNavigate()
  const { logout }     = useAuth()

  const businessName = params.get('bn') || 'Your business'

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: sans }}>
      <div
        style={{
          background: '#fff',
          border: `0.5px solid ${BORDER}`,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#fdf0f2', marginBottom: 24 }}>
          <Clock size={18} color={BURG} />
        </div>

        <h1 style={{ fontFamily: sans, fontSize: 26, fontWeight: 300, color: TEXT, margin: '0 0 8px' }}>
          You're almost live
        </h1>

        <p style={{ fontSize: 13, fontWeight: 400, color: BURG, margin: '0 0 16px' }}>
          {businessName}
        </p>

        <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 36px' }}>
          We're reviewing your business details. You'll receive an email once your account is approved.
        </p>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  marginTop: 4, width: 8, height: 8, flexShrink: 0,
                  background: step.done ? BURG : HINT,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 300, color: step.done ? TEXT : MUTED, lineHeight: 1.5 }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'block', width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: `0.5px solid ${BORDER}`,
            borderRadius: 10,
            fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', cursor: 'pointer',
            color: TEXT, fontFamily: sans, marginBottom: 20,
          }}
        >
          Log out
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 300, color: MUTED }}>
          Questions?{' '}
          <a href="mailto:support@kimawa.pro" style={{ color: BURG, textDecoration: 'none' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
