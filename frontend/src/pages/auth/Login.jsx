import { useState } from 'react'
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { useSignup } from '../../context/SignupContext'
import { publicClient } from '../../lib/apollo'
import { OWNER_LOGIN } from '../../graphql/mutations/auth'
import { setTokens, saveRole } from '../../lib/auth'

const sans = 'Inter, ui-sans-serif, system-ui, sans-serif'
const BURG   = '#6B2737'
const BORDER = '#ede5e7'

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

const PUBLIC_REST_URL = (
  import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/'
).replace(/\/graphql\/?$/, '')

const GoogleSVG = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function Login() {
  const { isAuthenticated, isOwner } = useAuth()
  const { setStep1 } = useSignup()
  const location = useLocation()
  const navigate  = useNavigate()

  const params   = new URLSearchParams(location.search)
  const verified = params.get('verified') === 'true'
  const tokenErr = params.get('error')

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const [ownerLogin, { loading }] = useMutation(OWNER_LOGIN, { client: publicClient })

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname ?? (isOwner ? '/owner' : '/staff')
    return <Navigate to={dest} replace />
  }

  function redirectAfterLogin({ accessToken, refreshToken, tenantSlug, isApproved, businessName }) {
    setTokens(accessToken, refreshToken)
    saveRole('owner')

    const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
    const port      = window.location.port || '3000'
    const destPath  = isApproved ? '/owner' : '/owner/pending'

    const dest = appDomain
      ? new URL(`https://${tenantSlug}.${appDomain}${destPath}`)
      : new URL(`http://${tenantSlug}.localhost:${port}${destPath}`)

    dest.searchParams.set('t', accessToken)
    dest.searchParams.set('r', refreshToken)
    if (!isApproved && businessName) dest.searchParams.set('bn', businessName)

    window.location.href = dest.toString()
  }

  async function submit(e) {
    e.preventDefault()
    setErrorMsg('')
    try {
      const { data } = await ownerLogin({ variables: { email: email.trim().toLowerCase(), password } })
      redirectAfterLogin(data.ownerLogin)
    } catch (err) {
      const raw = err?.graphQLErrors?.[0]?.message || err?.message || 'Invalid credentials.'
      if (raw.includes('not verified') || raw.includes('verification')) {
        setErrorMsg('Please verify your email before signing in. Check your inbox for the verification link.')
      } else {
        setErrorMsg(raw)
      }
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setErrorMsg('')
      try {
        const res = await fetch(`${PUBLIC_REST_URL}/auth/google/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        })
        const gdata = await res.json()
        if (gdata.error) { setErrorMsg(gdata.error); return }

        try {
          const { data } = await ownerLogin({
            variables: { email: gdata.email, googleToken: gdata.google_token },
          })
          redirectAfterLogin(data.ownerLogin)
        } catch (loginErr) {
          const msg = loginErr?.graphQLErrors?.[0]?.message || loginErr?.message || ''
          if (msg === 'NO_TENANT') {
            // No account yet — pre-fill context and send to Step 2
            setStep1({
              fullName: gdata.name || '',
              email: gdata.email || '',
              password: '',
              agreedToTerms: true,
              isGoogle: true,
              googleToken: gdata.google_token || '',
            })
            navigate('/signup/business')
          } else {
            setErrorMsg(msg || 'Google sign-in failed. Please try again.')
          }
        }
      } catch {
        setErrorMsg('Google sign-in failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setErrorMsg('Google sign-in was cancelled.'),
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'stretch', backgroundColor: '#fff', fontFamily: sans }}>
      {/* Left dark panel */}
      <div
        className="hidden lg:flex"
        style={{ width: 280, minWidth: 280, backgroundColor: '#1A0A0D', padding: '48px 40px', flexDirection: 'column', justifyContent: 'flex-start' }}
      >
      </div>

      {/* Right form panel */}
      <div
        className="max-sm:px-6 max-sm:py-14"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 56px' }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, marginBottom: 12 }}>
            Owner portal
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.2 }}>
            Sign in
          </h1>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 28px', lineHeight: 1.6 }}>
            Staff?{' '}
            <Link to="/staff" style={{ color: BURG, textDecoration: 'none' }}>Use the staff portal</Link>
            {' '}(no account needed).
          </p>

          {verified && (
            <div style={{ border: '0.5px solid #bbf7d0', backgroundColor: '#f0fdf4', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 20 }}>
              Email verified! You can now sign in.
            </div>
          )}
          {tokenErr === 'token_expired' && (
            <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
              Your verification link has expired. Please sign up again to get a new link.
            </div>
          )}
          {tokenErr === 'invalid_token' && (
            <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
              Invalid verification link. Please try again or contact support.
            </div>
          )}

          {errorMsg && (
            <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading || loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              border: `0.5px solid ${BORDER}`, borderRadius: 0,
              padding: '10px 14px', background: '#fff', cursor: 'pointer',
              fontSize: 12, fontWeight: 300, color: '#1a1a1a', fontFamily: sans,
              opacity: (googleLoading || loading) ? 0.6 : 1,
            }}
          >
            <GoogleSVG />
            {googleLoading ? 'Verifying…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: BORDER }} />
            <span style={{ fontSize: 11, color: '#b09090', fontWeight: 300 }}>or</span>
            <div style={{ flex: 1, height: '0.5px', background: BORDER }} />
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                onFocus={(e) => (e.target.style.borderColor = BURG)}
                onBlur={(e)  => (e.target.style.borderColor = '#e0dbd6')}
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
                onFocus={(e) => (e.target.style.borderColor = BURG)}
                onBlur={(e)  => (e.target.style.borderColor = '#e0dbd6')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{ width: '100%', padding: 13, backgroundColor: BURG, color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: sans }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 24 }}>
            New business?{' '}
            <Link to="/signup" style={{ color: BURG, textDecoration: 'none' }}>Create an account</Link>
            {' · '}
            <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Back to directory</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
