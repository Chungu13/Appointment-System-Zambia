import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useSignup } from '../../context/SignupContext'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#8A7A6A'
const BORDER = '#EDE3D6'

const serif = "'Inter', sans-serif"
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const PUBLIC_REST_URL = (
  import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/'
).replace(/\/graphql\/?$/, '')

export default function SignupVerifyEmail() {
  const location    = useLocation()
  const navigate    = useNavigate()
  const { step1 }  = useSignup()

  const isGoogle  = location.state?.isGoogle ?? false
  const email     = step1?.email || ''

  const [resent, setResent]     = useState(false)
  const [sending, setSending]   = useState(false)

  async function handleResend() {
    if (!email || sending) return
    setSending(true)
    try {
      await fetch(`${PUBLIC_REST_URL}/auth/resend-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResent(true)
    } catch {
      // fail silently
    } finally {
      setSending(false)
    }
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
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#fdf0f2', marginBottom: 24 }}>
          <Clock size={18} color={BURG} />
        </div>

        {isGoogle ? (
          <>
            <h1 style={{ fontFamily: sans, fontSize: 26, fontWeight: 300, color: TEXT, margin: '0 0 12px' }}>
              Account created
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 8px' }}>
              Your Google account has been verified. Your business is now under review. We'll email you at
            </p>
            <p style={{ fontSize: 13, fontWeight: 400, color: TEXT, margin: '0 0 20px' }}>{email}</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 32px' }}>
              once your account is approved.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: sans, fontSize: 26, fontWeight: 300, color: TEXT, margin: '0 0 12px' }}>
              Check your email
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 8px' }}>
              We've sent a verification link to
            </p>
            <p style={{ fontSize: 13, fontWeight: 400, color: TEXT, margin: '0 0 20px' }}>{email}</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 32px' }}>
              Click the link in the email to verify your address, then log in. The link expires in 24 hours.
            </p>
          </>
        )}

        {!isGoogle && (
          <>
            {resent ? (
              <p style={{ fontSize: 12, color: BURG, marginBottom: 16 }}>Verification email resent.</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                style={{
                  display: 'block', width: '100%',
                  padding: '10px 0',
                  background: 'transparent',
                  border: `0.5px solid ${BORDER}`,
                  borderRadius: 10,
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: sending ? 'default' : 'pointer',
                  color: TEXT, fontFamily: sans,
                  opacity: sending ? 0.6 : 1,
                  marginBottom: 16,
                }}
              >
                {sending ? 'Sending…' : 'Resend email'}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={{ background: 'none', border: 'none', fontSize: 12, color: MUTED, cursor: 'pointer', fontFamily: sans, fontWeight: 300 }}
            >
              Wrong email? Go back
            </button>
          </>
        )}

        {isGoogle && (
          <Link
            to="/login"
            style={{
              display: 'block',
              padding: '10px 0',
              background: BURG,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Go to login
          </Link>
        )}
      </div>
    </div>
  )
}
