import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#8A7A6A'
const BORDER = '#EDE3D6'

const serif = "'Inter', sans-serif"
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const API_BASE = (
  import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/'
).replace(/\/graphql\/?$/, '')

export default function VerifyEmail() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | error | expired

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    fetch(`${API_BASE}/auth/verify-email/?token=${encodeURIComponent(token)}&format=json`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          navigate(new URL(data.redirect).pathname + new URL(data.redirect).search, { replace: true })
        } else if (data.error === 'token_expired') {
          setStatus('expired')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'verifying') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
        <p style={{ fontSize: 13, color: MUTED }}>Verifying your email…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: sans }}>
      <div style={{ background: '#fff', border: `0.5px solid ${BORDER}`, padding: '48px 40px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 300, color: TEXT, margin: '0 0 16px' }}>
          {status === 'expired' ? 'Link expired' : 'Invalid link'}
        </h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 32px' }}>
          {status === 'expired'
            ? 'This verification link has expired. Please sign up again to get a new one.'
            : 'This verification link is invalid or has already been used.'}
        </p>
        <a
          href="/signup"
          style={{
            display: 'block', padding: '10px 0',
            background: BURG, color: '#fff',
            textDecoration: 'none',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Back to signup
        </a>
      </div>
    </div>
  )
}
