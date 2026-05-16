import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { REGISTER_TENANT } from '../../graphql/mutations/auth'
import { setTokens, saveRole } from '../../lib/auth'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#3d5c40'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_CHIP = '#d4ecd4'

const BUSINESS_TYPES = [
  { value: 'salon',          label: 'Salon' },
  { value: 'barbershop',     label: 'Barbershop' },
  { value: 'nail_tech',      label: 'Nail Technician' },
  { value: 'spa',            label: 'Spa' },
  { value: 'lash_studio',    label: 'Lash Studio' },
  { value: 'makeup_artist',  label: 'Makeup Artist' },
  { value: 'other',          label: 'Other' },
]

const CITIES = ['Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Kabwe', 'Chipata', 'Solwezi', 'Other']

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: TEXT }}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
        focus:ring-2 focus:ring-offset-0 ${className}`}
      style={{
        borderColor: '#d1d5db',
        color: TEXT,
        backgroundColor: '#ffffff',
      }}
      onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${MINT_CHIP}` }}
      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
      {...props}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-xl border px-4 py-3 text-sm outline-none bg-white"
      style={{ borderColor: '#d1d5db', color: TEXT }}
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
      setForm((f) => ({ ...f, [k]: e.target.value }))
      setFieldErrors((fe) => ({ ...fe, [k]: '' }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Required'
    if (!form.ownerName.trim()) errs.ownerName = 'Required'
    if (!form.phone.trim() || form.phone === '+260') errs.phone = 'Enter your phone number'
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
      const { data } = await register({
        variables: {
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          city: form.city,
          address: form.address.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      })

      const { accessToken, refreshToken, tenantSubdomain, staffAccessKey } = data.registerTenant

      // Store tokens in current origin's localStorage — they'll be re-read via URL
      // params when we land on the subdomain (different origin).
      // Passing tokens + business metadata via URL search params.
      const port = window.location.port || '3000'
      const url = new URL(`http://${tenantSubdomain}.localhost:${port}/onboarding`)
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
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', backgroundColor: MINT, minHeight: '100vh' }}>
      <LandingNav />

      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-medium"
            style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
          >
            <span>✦</span>
            <span>14-day free trial — no card needed</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: TEXT }}>
            List your business
          </h1>
          <p className="text-sm" style={{ color: MUTED }}>
            Setup takes under 10 minutes.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #e8f0e8' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business info */}
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: PRIMARY }}>
              About your business
            </p>

            <Field label="Business name" error={fieldErrors.businessName}>
              <Input
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Glow Salon Lusaka"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Business type" error={fieldErrors.businessType}>
                <Select value={form.businessType} onChange={set('businessType')}>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>

              <Field label="City" error={fieldErrors.city}>
                <Select value={form.city} onChange={set('city')}>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Address (optional)">
              <Input
                value={form.address}
                onChange={set('address')}
                placeholder="e.g. Shop 4, Cairo Road"
              />
            </Field>

            {/* Owner info */}
            <p className="text-xs font-bold uppercase tracking-widest pt-2" style={{ color: PRIMARY }}>
              Your account
            </p>

            <Field label="Your full name" error={fieldErrors.ownerName}>
              <Input
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder="Full name"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" error={fieldErrors.phone}>
                <Input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+260 97 000 0000"
                  type="tel"
                />
              </Field>

              <Field label="Email" error={fieldErrors.email}>
                <Input
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  type="email"
                />
              </Field>
            </div>

            <Field label="Password" error={fieldErrors.password}>
              <div className="relative">
                <Input
                  value={form.password}
                  onChange={set('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password" error={fieldErrors.confirmPassword}>
              <Input
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat password"
              />
            </Field>

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setAgreedToTerms((v) => !v)}
                  className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: agreedToTerms ? PRIMARY : '#d1d5db',
                    backgroundColor: agreedToTerms ? PRIMARY : 'transparent',
                  }}
                >
                  {agreedToTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm" style={{ color: MUTED }}>
                  I agree to BeautyBook ZM's{' '}
                  <a href="#" style={{ color: PRIMARY }} className="hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: PRIMARY }} className="hover:underline">Privacy Policy</a>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.terms}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading ? 'Creating your account…' : (
                <>Create my account <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs" style={{ color: MUTED }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: PRIMARY }} className="font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
