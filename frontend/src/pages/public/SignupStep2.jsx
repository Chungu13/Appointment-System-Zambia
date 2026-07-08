import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { publicClient } from '../../lib/apollo'
import { REGISTER_TENANT } from '../../graphql/mutations/auth'
import { useSignup } from '../../context/SignupContext'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'

const BURG      = '#6B2737'
const DARK_BURG = '#1A0A0D'
const TEXT      = '#1a0a0d'
const MUTED     = '#b09090'
const BORDER    = '#ede5e7'

const sans = 'Inter, ui-sans-serif, system-ui, sans-serif'

const BUSINESS_TYPES = [
  { value: 'salon',         label: 'Salon' },
  { value: 'barbershop',    label: 'Barbershop' },
  { value: 'nail_tech',     label: 'Nail Technician' },
  { value: 'spa',           label: 'Spa' },
  { value: 'lash_studio',   label: 'Lash Studio' },
  { value: 'makeup_artist', label: 'Makeup Artist' },
  { value: 'other',         label: 'Other' },
]

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

function Input({ onBlur: outerBlur, style: override = {}, ...props }) {
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
      onBlur={(e) => { e.target.style.borderColor = BORDER; outerBlur?.() }}
      {...props}
    />
  )
}

function SelectField({ children, ...props }) {
  return (
    <select
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `0.5px solid ${BORDER}`, borderRadius: 0,
        padding: '10px 14px', fontSize: 12, color: TEXT,
        outline: 'none', backgroundColor: '#fff',
        fontFamily: sans, fontWeight: 300,
        appearance: 'none',
      }}
      {...props}
    >
      {children}
    </select>
  )
}

function validatePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('260') && digits.length === 12) return true
  if (digits.startsWith('0')   && digits.length === 10) return true
  return false
}

export default function SignupStep2() {
  const navigate   = useNavigate()
  const { step1 } = useSignup()

  const [form, setForm] = useState({
    businessName: '',
    businessType: 'salon',
    city: 'Lusaka',
    area: '',
    areaOther: '',
    phone: '+260',
    address: '',
  })
  const [errors, setErrors]           = useState({})
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
      setErrors((er) => ({ ...er, [k]: '' }))
    }
  }

  function blurValidate(field) {
    if (field === 'businessName' && !form.businessName.trim()) {
      setErrors((er) => ({ ...er, businessName: 'Required' }))
    }
    if (field === 'phone' && !validatePhone(form.phone)) {
      setErrors((er) => ({ ...er, phone: 'Enter a valid Zambian number (e.g. +260 97 123 4567)' }))
    }
    if (field === 'address' && !form.address.trim()) {
      setErrors((er) => ({ ...er, address: 'Required' }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Required'
    if (!validatePhone(form.phone)) errs.phone = 'Enter a valid Zambian number (e.g. +260 97 123 4567)'
    if (!form.address.trim()) errs.address = 'Required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const effectiveArea = form.city === 'Lusaka'
      ? (form.area === 'Other' ? form.areaOther.trim() : form.area)
      : form.area.trim()

    try {
      await register({
        variables: {
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          city: form.city,
          area: effectiveArea,
          address: form.address.trim(),
          ownerName: step1.fullName,
          phone: form.phone.trim(),
          email: step1.email,
          password: step1.isGoogle ? '' : step1.password,
          googleToken: step1.googleToken || '',
          honeypot: step1.honeypot || '',
          turnstileToken: step1.turnstileToken || '',
        },
      })
      navigate('/signup/verify-email', { state: { isGoogle: step1.isGoogle } })
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong.'
      setServerError(msg)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: sans }}>
      {/* Left brand panel */}
      <div
        className="hidden sm:flex"
        style={{ width: 240, minWidth: 240, background: DARK_BURG, flexDirection: 'column', justifyContent: 'space-between', padding: '48px 32px' }}
      />

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 44px', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <StepIndicator step={2} />

          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, marginBottom: 10 }}>
            New Business
          </p>
          <h1 style={{ fontFamily: sans, fontSize: 28, fontWeight: 400, color: TEXT, margin: '0 0 6px', lineHeight: 1.2 }}>
            About your business
          </h1>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '0 0 28px' }}>
            This is how you'll appear on Kimawa.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Business name</Label>
              <Input
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Glow Salon Lusaka"
                onBlur={() => blurValidate('businessName')}
              />
              {errors.businessName && <p style={{ fontFamily: sans, fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 300 }}>{errors.businessName}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Business type</Label>
                <SelectField value={form.businessType} onChange={set('businessType')}>
                  {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </SelectField>
              </div>
              <div>
                <Label>City</Label>
                <SelectField value={form.city} onChange={set('city')}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </SelectField>
              </div>
            </div>

            <div>
              <Label>Phone number</Label>
              <Input
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                placeholder="+260971234567"
                maxLength={13}
                onBlur={() => blurValidate('phone')}
              />
              {errors.phone && <p style={{ fontFamily: sans, fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 300 }}>{errors.phone}</p>}
            </div>

            <div>
              <Label>Area</Label>
              {form.city === 'Lusaka' ? (
                <>
                  <SelectField value={form.area} onChange={set('area')}>
                    <option value="">Select area…</option>
                    {LUSAKA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </SelectField>
                  {form.area === 'Other' && (
                    <Input style={{ marginTop: 6 }} value={form.areaOther} onChange={set('areaOther')} placeholder="Enter your area" />
                  )}
                </>
              ) : (
                <Input value={form.area} onChange={set('area')} placeholder="Area / suburb (optional)" />
              )}
            </div>

            <div>
              <Label>Detailed address / directions</Label>
              <Input
                value={form.address}
                onChange={set('address')}
                placeholder="e.g. Shop 4, Cairo Road"
                onBlur={() => blurValidate('address')}
              />
              {errors.address && <p style={{ fontFamily: sans, fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 300 }}>{errors.address}</p>}
            </div>

            {serverError && (
              <div style={{ border: `0.5px solid #fca5a5`, background: '#fef2f2', padding: '10px 14px', fontFamily: sans, fontSize: 12, color: '#dc2626', fontWeight: 300 }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px 0', background: BURG, color: '#fff', border: 'none', borderRadius: 0, fontFamily: sans, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
            >
              {loading ? 'Creating your account…' : 'Create my account'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: 12, color: MUTED, cursor: 'pointer', textAlign: 'center', fontWeight: 300 }}
            >
              Back
            </button>

            <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: 0 }}>
              By creating an account you agree to our{' '}
              <a href="/business-terms" target="_blank" rel="noopener noreferrer" style={{ color: BURG, textDecoration: 'none' }}>Business Terms of Service</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
