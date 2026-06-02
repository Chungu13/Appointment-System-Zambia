import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { useAuth } from '../../context/AuthContext'
import { publicClient } from '../../lib/apollo'
import { OWNER_LOGIN } from '../../graphql/mutations/auth'
import { setTokens, saveRole } from '../../lib/auth'

const sans = 'Inter, ui-sans-serif, system-ui, sans-serif'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid #e0dbd6',
  borderRadius: 5,
  padding: '11px 14px',
  fontSize: 13,
  color: '#1a1a1a',
  outline: 'none',
  backgroundColor: '#fff',
  fontFamily: sans,
  WebkitBoxShadow: '0 0 0 1000px #fff inset',
}

export default function Login() {
  const { isAuthenticated, isOwner } = useAuth()
  const location = useLocation()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [ownerLogin, { loading }] = useMutation(OWNER_LOGIN, { client: publicClient })

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname ?? (isOwner ? '/owner' : '/staff')
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    setErrorMsg('')
    try {
      const { data } = await ownerLogin({ variables: { email: email.trim().toLowerCase(), password } })
      const { accessToken, refreshToken, tenantSlug } = data.ownerLogin

      setTokens(accessToken, refreshToken)
      saveRole('owner')

      const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
      const dest = appDomain
        ? new URL(`https://${tenantSlug}.${appDomain}/owner`)
        : new URL(`http://${tenantSlug}.localhost:${window.location.port || '3000'}/owner`)
      dest.searchParams.set('t', accessToken)
      dest.searchParams.set('r', refreshToken)
      window.location.href = dest.toString()
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Invalid credentials.'
      setErrorMsg(msg)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'stretch', backgroundColor: '#fff', fontFamily: sans }}>
      {/* Left dark panel */}
      <div
        className="hidden lg:flex"
        style={{ width: 280, minWidth: 280, backgroundColor: '#1A0A0D', padding: '48px 40px', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 500 }}>Kimawa</span>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
          Your salon,<br />always open.
        </p>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>kimawa.pro</span>
      </div>

      {/* Right form panel */}
      <div
        className="max-sm:px-6 max-sm:py-14"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 56px' }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B2737', marginBottom: 12 }}>
            Owner portal
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.2 }}>
            Sign in
          </h1>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
            Staff?{' '}
            <Link to="/staff" style={{ color: '#6B2737', textDecoration: 'none' }}>Use the staff portal</Link>
            {' '}(no account needed).
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMsg && (
              <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="your@email.com"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6B2737')}
                onBlur={(e) => (e.target.style.borderColor = '#e0dbd6')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6B2737')}
                onBlur={(e) => (e.target.style.borderColor = '#e0dbd6')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 13, backgroundColor: '#6B2737', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: sans }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to directory</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
