import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useSignup } from '../../context/SignupContext'

const BURG      = '#6B2737'
const DARK_BURG = '#4A1A25'
const TEXT      = '#1a0a0d'
const MUTED     = '#b09090'
const BORDER    = '#ede5e7'
const OFF_WHITE = '#faf7f7'

const serif = '"Cormorant Garamond", Georgia, serif'
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const PUBLIC_REST_URL = (
  import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/'
).replace(/\/graphql\/?$/, '')

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

function StepIndicator({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      <div style={{ width: 20, height: 2, background: BURG }} />
      <div style={{ width: 20, height: 2, background: step >= 2 ? BURG : BORDER }} />
    </div>
  )
}

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: MUTED, marginBottom: 6, fontFamily: sans, letterSpacing: '0.04em' }}>
      {children}
    </label>
  )
}

function Input({ style: override = {}, ...props }) {
  return (
    <input
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `0.5px solid ${BORDER}`, borderRadius: 0,
        padding: '10px 14px', fontSize: 12, color: TEXT,
        outline: 'none', backgroundColor: '#fff',
        fontFamily: sans, fontWeight: 300,
        ...override,
      }}
      onFocus={(e) => (e.target.style.borderColor = BURG)}
      onBlur={(e) => (e.target.style.borderColor = BORDER)}
      {...props}
    />
  )
}

const GoogleSVG = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function SignupStep1() {
  const navigate    = useNavigate()
  const { setStep1 } = useSignup()

  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [honeypot, setHoneypot] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [googleError, setGoogleError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const formLoadTime = useRef(Date.now())
  const honeypotRef  = useRef(null)

  function set(k) {
    return (e) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))
      setErrors((er) => ({ ...er, [k]: '' }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Required'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Enter a valid email'
    if (form.password.length < 8) errs.password = 'At least 8 characters'
    if (!agreed) errs.terms = 'You must agree to the terms to continue'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Honeypot: silently do nothing if a bot filled the hidden field.
    // Also check the raw DOM value — some autofill tools set it without firing React's onChange.
    if (honeypot || honeypotRef.current?.value) return

    // Time-based check: reject if form submitted in under 5 seconds
    const elapsed = (Date.now() - formLoadTime.current) / 1000
    if (elapsed < 5) {
      setErrors({ terms: 'Please take a moment to fill in the form.' })
      return
    }

    const errs = validate()

    // Require Turnstile token when site key is configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      errs.turnstile = 'Please complete the security check.'
    }

    if (Object.keys(errs).length) { setErrors(errs); return }

    setStep1({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      agreedToTerms: true,
      isGoogle: false,
      googleToken: '',
      honeypot,
      turnstileToken,
    })
    navigate('/signup/business')
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setGoogleError('')
      try {
        const res = await fetch(`${PUBLIC_REST_URL}/auth/google/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        })
        const data = await res.json()
        if (data.error) { setGoogleError(data.error); return }
        setStep1({
          fullName: data.name || '',
          email: data.email || '',
          password: '',
          agreedToTerms: true,
          isGoogle: true,
          googleToken: data.google_token || '',
          honeypot: '',
          turnstileToken,
        })
        navigate('/signup/business')
      } catch {
        setGoogleError('Google sign-in failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setGoogleError('Google sign-in was cancelled.'),
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: sans }}>
      {/* Left brand panel */}
      <div
        className="hidden sm:flex"
        style={{
          width: 240, minWidth: 240,
          background: DARK_BURG,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 32px',
        }}
      >
        <div>
          <span style={{ fontFamily: serif, fontSize: 20, color: '#fff', fontWeight: 400, letterSpacing: '0.04em' }}>
            Kimawa
          </span>
        </div>
        <p style={{ fontFamily: serif, fontSize: 17, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.6 }}>
          Your salon,<br />always open.
        </p>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 300, letterSpacing: '0.08em' }}>
          kimawa.pro
        </span>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 44px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <StepIndicator step={1} />

          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, marginBottom: 10 }}>
            New Business
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: TEXT, margin: '0 0 6px', lineHeight: 1.2 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 12, fontWeight: 300, color: MUTED, margin: '0 0 28px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: BURG, textDecoration: 'none' }}>Sign in</Link>
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              border: `0.5px solid ${BORDER}`, borderRadius: 0,
              padding: '10px 14px', background: '#fff', cursor: 'pointer',
              fontSize: 12, fontWeight: 300, color: TEXT, fontFamily: sans,
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            <GoogleSVG />
            {googleLoading ? 'Verifying…' : 'Continue with Google'}
          </button>

          {googleError && (
            <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{googleError}</p>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: BORDER }} />
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 300 }}>or</span>
            <div style={{ flex: 1, height: '0.5px', background: BORDER }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Honeypot — hidden from real users, bots fill it */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="nope"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />

            <div>
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={set('fullName')} placeholder="Your full name" autoComplete="name" />
              {errors.fullName && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errors.fullName}</p>}
            </div>

            <div>
              <Label>Email address</Label>
              <Input value={form.email} onChange={set('email')} type="email" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <Input
                  value={form.password}
                  onChange={set('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Terms */}
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <div
                  onClick={() => setAgreed((v) => !v)}
                  style={{
                    marginTop: 2, width: 14, height: 14, flexShrink: 0,
                    border: `0.5px solid ${agreed ? BURG : BORDER}`,
                    background: agreed ? BURG : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {agreed && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 300, lineHeight: 1.6 }}>
                  I agree to Kimawa's{' '}
                  <a href="#" style={{ color: BURG }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: BURG }}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errors.terms}</p>}
            </div>

            {/* Cloudflare Turnstile */}
            {TURNSTILE_SITE_KEY && (
              <div>
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  options={{ theme: 'light', size: 'normal' }}
                />
                {errors.turnstile && (
                  <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errors.turnstile}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%', padding: '11px 0',
                background: BURG, color: '#fff',
                border: 'none', borderRadius: 0,
                fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
                textTransform: 'uppercase', cursor: 'pointer', fontFamily: sans,
                marginTop: 4,
              }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
