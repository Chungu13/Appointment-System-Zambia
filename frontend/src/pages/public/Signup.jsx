import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { REGISTER_TENANT } from '../../graphql/mutations/auth'
import { setTokens, saveRole } from '../../lib/auth'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY = '#6B2737'
const TEXT    = '#1a1a1a'
const MUTED   = '#666'
const BORDER  = '#e0dbd6'

const BUSINESS_TYPES = [
  { value: 'salon',          label: 'Salon' },
  { value: 'barbershop',     label: 'Barbershop' },
  { value: 'nail_tech',      label: 'Nail Technician' },
  { value: 'spa',            label: 'Spa' },
  { value: 'lash_studio',    label: 'Lash Studio' },
  { value: 'makeup_artist',  label: 'Makeup Artist' },
  { value: 'other',          label: 'Other' },
]

const sans = 'Inter, ui-sans-serif, system-ui, sans-serif'

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 6, fontFamily: sans }}>
        {label}
      </label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

function Input({ style: override = {}, ...props }) {
  return (
    <input
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `0.5px solid ${BORDER}`, borderRadius: 5,
        padding: '11px 14px', fontSize: 13, color: TEXT,
        outline: 'none', backgroundColor: '#fff', fontFamily: sans,
        ...override,
      }}
      onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
      onBlur={(e) => (e.target.style.borderColor = BORDER)}
      {...props}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `0.5px solid ${BORDER}`, borderRadius: 5,
        padding: '11px 14px', fontSize: 13, color: TEXT,
        outline: 'none', backgroundColor: '#fff', fontFamily: sans,
      }}
      {...props}
    >
      {children}
    </select>
  )
}

export default function Signup() {
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'salon',
    city: 'Lusaka',
    area: '',
    areaOther: '',
    address: '',
    ownerName: '',
    phone: '+260',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const [register, { loading }] = useMutation(REGISTER_TENANT, { client: publicClient })

  function set(k) {
    return (e) => {
      const val = e.target.value
      setForm((f) => {
        const next = { ...f, [k]: val }
        if (k === 'city') { next.area = ''; next.areaOther = '' }
        if (k === 'area') { next.areaOther = '' }
        return next
      })
      setFieldErrors((fe) => ({ ...fe, [k]: '' }))
    }
  }

  function validatePhone(raw) {
    const digits = raw.replace(/\D/g, '')
    // Accept +260XXXXXXXXX (12 digits) or 0XXXXXXXXX (10 digits starting with 0)
    if (digits.startsWith('260') && digits.length === 12) return true
    if (digits.startsWith('0') && digits.length === 10) return true
    return false
  }

  function validate() {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Required'
    if (!form.ownerName.trim()) errs.ownerName = 'Required'
    if (!validatePhone(form.phone)) errs.phone = 'Enter a valid Zambian number — e.g. +260 97 123 4567'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Enter a valid email'
    if (form.password.length < 8) errs.password = 'At least 8 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!agreedToTerms) errs.terms = 'You must agree to the terms to continue'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    try {
      const effectiveArea = form.city === 'Lusaka'
        ? (form.area === 'Other' ? form.areaOther.trim() : form.area)
        : form.area.trim()

      const { data } = await register({
        variables: {
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          city: form.city,
          area: effectiveArea,
          address: form.address.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      })

      const { accessToken, refreshToken, tenantSubdomain, staffAccessKey } = data.registerTenant

      // Onboarding always stays on the main domain — no SSL delay waiting for new subdomain cert.
      // In production: https://{VITE_TENANT_APP_DOMAIN}/onboarding?slug=...
      // In dev: http://localhost:{port}/onboarding?slug=...
      const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
      const base = appDomain
        ? `https://${appDomain}`
        : `http://localhost:${window.location.port || '3000'}`
      const url = new URL(`${base}/onboarding`)
      url.searchParams.set('slug', tenantSubdomain)
      url.searchParams.set('t', accessToken)
      url.searchParams.set('r', refreshToken)
      url.searchParams.set('bt', form.businessType)
      url.searchParams.set('sk', staffAccessKey)

      window.location.href = url.toString()
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong.'
      setServerError(msg)
    }
  }

  return (
    <div style={{ fontFamily: sans, backgroundColor: '#fff', minHeight: '100vh' }}>
      <LandingNav />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>
            New business
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 500, color: TEXT, margin: '0 0 12px', lineHeight: 1.2 }}>
            List your business
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            Get your business online in minutes. Free to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Section 1 — About your business */}
          <div style={{ paddingBottom: 32, marginBottom: 32, borderBottom: `0.5px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: PRIMARY, margin: 0 }}>
              About your business
            </p>

            <Field label="Business name" error={fieldErrors.businessName}>
              <Input value={form.businessName} onChange={set('businessName')} placeholder="e.g. Glow Salon Lusaka" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-sm:grid-cols-1">
              <Field label="Business type" error={fieldErrors.businessType}>
                <Select value={form.businessType} onChange={set('businessType')}>
                  {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="City" error={fieldErrors.city}>
                <Select value={form.city} onChange={set('city')}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Area">
              {form.city === 'Lusaka' ? (
                <>
                  <Select value={form.area} onChange={set('area')}>
                    <option value="">Select area…</option>
                    {LUSAKA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </Select>
                  {form.area === 'Other' && (
                    <Input style={{ marginTop: 8 }} value={form.areaOther} onChange={set('areaOther')} placeholder="Enter your area" />
                  )}
                </>
              ) : (
                <Input value={form.area} onChange={set('area')} placeholder="Area / suburb (optional)" />
              )}
            </Field>

            <Field label="Detailed address / directions (optional)">
              <Input value={form.address} onChange={set('address')} placeholder="e.g. Shop 4, Cairo Road" />
            </Field>
          </div>

          {/* Section 2 — Your account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: PRIMARY, margin: 0 }}>
              Your account
            </p>

            <Field label="Your full name" error={fieldErrors.ownerName}>
              <Input value={form.ownerName} onChange={set('ownerName')} placeholder="Full name" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-sm:grid-cols-1">
              <Field label="Phone" error={fieldErrors.phone}>
                <Input value={form.phone} onChange={set('phone')} placeholder="+260 97 000 0000" type="tel" maxLength={16} />
                <p style={{ marginTop: 4, fontSize: 11, color: '#999' }}>Format: +260 97 123 4567</p>
              </Field>
              <Field label="Email" error={fieldErrors.email}>
                <Input value={form.email} onChange={set('email')} placeholder="you@example.com" type="email" />
              </Field>
            </div>

            <Field label="Password" error={fieldErrors.password}>
              <div style={{ position: 'relative' }}>
                <Input
                  value={form.password}
                  onChange={set('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password" error={fieldErrors.confirmPassword}>
              <Input value={form.confirmPassword} onChange={set('confirmPassword')} type={showPw ? 'text' : 'password'} placeholder="Repeat password" />
            </Field>

            {/* Terms */}
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <div
                  onClick={() => setAgreedToTerms((v) => !v)}
                  style={{ marginTop: 2, width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${agreedToTerms ? PRIMARY : BORDER}`, backgroundColor: agreedToTerms ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}
                >
                  {agreedToTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                  I agree to Kimawa's{' '}
                  <a href="#" style={{ color: PRIMARY }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: PRIMARY }}>Privacy Policy</a>
                </span>
              </label>
              {fieldErrors.terms && <p style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>{fieldErrors.terms}</p>}
            </div>

            {serverError && (
              <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 13, backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: sans, marginTop: 8 }}
            >
              {loading ? 'Creating your account…' : <><span>Create my account</span><ArrowRight size={15} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: MUTED }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: PRIMARY, fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        </form>
      </div>

      <LandingFooter />
    </div>
  )
}
