import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { KeyRound, Copy, Check, RefreshCw, Camera, X, Bot, MapPin, Clock } from 'lucide-react'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { SET_STAFF_ACCESS_KEY, UPDATE_TENANT_PROFILE, UPDATE_BUSINESS_POLICIES, UPDATE_OPENING_HOURS } from '../../graphql/mutations/tenant'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

const BURG      = '#3B2A1E'
const TEXT      = '#241812'
const MUTED     = '#5C4C3D'
const HINT      = '#8A7A6A'
const BORDER    = '#EDE3D6'
const BLUSH     = '#FBF7F1'
const OFF_WHITE = '#FBF7F1'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

const cardStyle = {
  backgroundColor: '#fff',
  border: `0.5px solid ${BORDER}`,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const headingStyle = {
  fontFamily: serif,
  fontSize: 20,
  fontWeight: 300,
  color: TEXT,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const labelStyle = {
  fontFamily: sans,
  fontSize: 10,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTED,
  display: 'block',
  marginBottom: 6,
}

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: `0.5px solid ${BORDER}`,
  fontFamily: sans,
  fontSize: 13,
  fontWeight: 300,
  color: TEXT,
  backgroundColor: '#fff',
  outline: 'none',
}

const savedSpan = { fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#2d6a4f' }

function SaveBtn({ onClick, disabled, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '9px 24px',
        backgroundColor: disabled || loading ? '#d4a8b0' : BURG,
        color: '#fff',
        border: 'none',
        fontFamily: sans,
        fontSize: 10,
        fontWeight: 300,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  )
}

// ── Business profile photo ────────────────────────────────────────────────────

function BusinessProfileCard({ currentImageUrl }) {
  const [preview, setPreview] = useState(currentImageUrl || null)
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const [updateProfile, { loading }] = useMutation(UPDATE_TENANT_PROFILE, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  function processFile(file) {
    setValidationError(null)
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setValidationError('Only JPG and PNG files are accepted.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File must be under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      updateProfile({ variables: { coverImageUrl: dataUrl } })
    }
    reader.readAsDataURL(file)
  }

  function handleFileChange(e) { processFile(e.target.files?.[0]) }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function removePhoto() {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
    updateProfile({ variables: { coverImageUrl: '' } })
  }

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={headingStyle}>
          <Camera size={18} color={BURG} />
          Business profile photo
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          This photo appears on your public salon listing in the directory.
        </p>
      </div>

      {validationError && (
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#dc2626', margin: 0 }}>{validationError}</p>
      )}

      {preview ? (
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <img
            src={preview}
            alt="Business cover"
            style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block', border: `0.5px solid ${BORDER}` }}
          />
          <button
            onClick={removePhoto}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#fff' }}>Saving…</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            maxWidth: 360, height: 160,
            border: `0.5px solid ${dragging ? BURG : BORDER}`,
            backgroundColor: dragging ? BLUSH : '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, cursor: 'pointer',
            transition: 'border-color 0.1s, background-color 0.1s',
          }}
        >
          <Camera size={28} color={HINT} />
          <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>Click or drag a photo here</span>
          <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT }}>JPG or PNG, max 5 MB</span>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleFileChange} />

      {saved && <span style={savedSpan}>Saved ✓</span>}
    </div>
  )
}

// ── Location ──────────────────────────────────────────────────────────────────

function LocationCard({ currentCity, currentArea, currentAddress }) {
  const [city, setCity]           = useState(currentCity || 'Lusaka')
  const [area, setArea]           = useState(currentArea || '')
  const [areaOther, setAreaOther] = useState('')
  const [address, setAddress]     = useState(currentAddress || '')
  const [saved, setSaved]         = useState(false)

  const [updateProfile, { loading, error }] = useMutation(UPDATE_TENANT_PROFILE, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  const isLusaka = city === 'Lusaka'
  const effectiveArea = isLusaka ? (area === 'Other' ? areaOther.trim() : area) : area

  function handleCityChange(e) {
    setCity(e.target.value)
    setArea('')
    setAreaOther('')
  }

  function save() {
    updateProfile({ variables: { city, area: effectiveArea, address: address.trim() } })
  }

  const onFocus = (e) => (e.target.style.borderColor = BURG)
  const onBlur  = (e) => (e.target.style.borderColor = BORDER)

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={headingStyle}>
          <MapPin size={18} color={BURG} />
          Location
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          Shown on your public listing so customers can find you.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>City</label>
          <select value={city} onChange={handleCityChange} style={fieldStyle} onFocus={onFocus} onBlur={onBlur}>
            {CITIES.filter((c) => c !== 'Other').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>{isLusaka ? 'Area (Lusaka neighbourhood)' : 'Area / suburb'}</label>
          {isLusaka ? (
            <>
              <select
                value={area}
                onChange={(e) => { setArea(e.target.value); setAreaOther('') }}
                style={fieldStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="">Select area…</option>
                {LUSAKA_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {area === 'Other' && (
                <input
                  type="text"
                  value={areaOther}
                  onChange={(e) => setAreaOther(e.target.value)}
                  placeholder="Enter your area"
                  style={{ ...fieldStyle, marginTop: 8 }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              )}
            </>
          ) : (
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Riverside, CBD"
              style={fieldStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          )}
        </div>

        <div>
          <label style={labelStyle}>Detailed address / directions</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop 4, Cairo Road, next to Game"
            rows={2}
            style={{ ...fieldStyle, resize: 'none' }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <SaveBtn onClick={save} loading={loading}>Save location</SaveBtn>
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Opening hours ─────────────────────────────────────────────────────────────

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function OpeningHoursCard({ current }) {
  const [rows, setRows] = useState(() =>
    DAY_LABELS.map((_, day) => {
      const row = (current ?? []).find((h) => h.dayOfWeek === day)
      return {
        dayOfWeek: day,
        opens: row?.opens || '08:00',
        closes: row?.closes || '18:00',
        closed: row?.closed ?? false,
      }
    }),
  )
  const [saved, setSaved] = useState(false)

  const [updateHours, { loading, error }] = useMutation(UPDATE_OPENING_HOURS, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  function updateDay(day, patch) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)))
  }

  function copyToAll(day) {
    const src = rows[day]
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? r : { ...r, opens: src.opens, closes: src.closes, closed: src.closed })))
  }

  function save() {
    updateHours({
      variables: {
        hours: rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          opens: r.closed ? '' : r.opens,
          closes: r.closed ? '' : r.closes,
          closed: r.closed,
        })),
      },
    })
  }

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={headingStyle}>
          <Clock size={18} color={BURG} />
          Opening hours
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          When your business is open. Shown on your public page and used by search engines.
          Appointment times are picked per staff member in Staff → Hours, within these hours.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div
            key={r.dayOfWeek}
            style={{ border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: r.closed ? '#999' : TEXT, width: 88, flexShrink: 0 }}>
              {DAY_LABELS[r.dayOfWeek]}
            </span>

            {r.closed ? (
              <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#999', flex: 1 }}>Closed</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                <input
                  type="time"
                  value={r.opens}
                  onChange={(e) => updateDay(r.dayOfWeek, { opens: e.target.value })}
                  style={{ ...fieldStyle, padding: '7px 9px', fontSize: 12, flex: 1, minWidth: 0 }}
                />
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>to</span>
                <input
                  type="time"
                  value={r.closes}
                  onChange={(e) => updateDay(r.dayOfWeek, { closes: e.target.value })}
                  style={{ ...fieldStyle, padding: '7px 9px', fontSize: 12, flex: 1, minWidth: 0 }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => updateDay(r.dayOfWeek, { closed: !r.closed })}
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', color: MUTED, cursor: 'pointer', flexShrink: 0 }}
            >
              {r.closed ? 'Set open' : 'Set closed'}
            </button>

            {!r.closed && (
              <button
                type="button"
                onClick={() => copyToAll(r.dayOfWeek)}
                style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', color: MUTED, cursor: 'pointer', flexShrink: 0 }}
              >
                Same for all days
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <SaveBtn onClick={save} loading={loading}>Save opening hours</SaveBtn>
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Staff access key ──────────────────────────────────────────────────────────

function generateKey() {
  const words = ['GLOW', 'SALON', 'BEAUTY', 'SHINE', 'STYLE', 'GRACE']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}${num}`
}

function CopyableUrl({ url }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}>
      <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, backgroundColor: OFF_WHITE, padding: '1px 6px', border: `0.5px solid ${BORDER}` }}>
        {url}
      </span>
      <button
        onClick={copy}
        title="Copy URL"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center', color: copied ? '#2d6a4f' : MUTED }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </span>
  )
}

function StaffKeyCard({ currentKey }) {
  const [key, setKey]       = useState(currentKey || '')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [setStaffKey, { loading, error }] = useMutation(SET_STAFF_ACCESS_KEY, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  function copy() {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function save() {
    if (!key.trim()) return
    setStaffKey({ variables: { key: key.trim() } })
  }

  const iconBtn = {
    padding: '0 12px',
    border: `0.5px solid ${BORDER}`,
    backgroundColor: '#fff',
    color: MUTED,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={headingStyle}>
          <KeyRound size={18} color={BURG} />
          Staff access key
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          Share these links and the key below with your team.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, width: 96, flexShrink: 0 }}>Booking page</span>
            <CopyableUrl url={window.location.origin} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, width: 96, flexShrink: 0 }}>Staff page</span>
            <CopyableUrl url={`${window.location.origin}/staff`} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, paddingLeft: 2 }}>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: 0, lineHeight: 1.7 }}>
            <span style={{ fontWeight: 400, color: MUTED }}>Booking page:</span> customers use this to browse services and book appointments.
          </p>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: 0, lineHeight: 1.7 }}>
            <span style={{ fontWeight: 400, color: MUTED }}>Staff page:</span> staff enter the key below to view today's appointments.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="e.g. GLOW2024"
          style={{ flex: 1, ...fieldStyle, fontSize: 16, fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase' }}
          onFocus={(e) => (e.target.style.borderColor = BURG)}
          onBlur={(e) => (e.target.style.borderColor = BORDER)}
        />
        <button onClick={copy} title="Copy key" style={iconBtn}>
          {copied ? <Check size={16} color="#2d6a4f" /> : <Copy size={16} />}
        </button>
        <button onClick={() => setKey(generateKey())} title="Generate new key" style={iconBtn}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <SaveBtn onClick={save} loading={loading} disabled={!key.trim() || key.trim() === currentKey}>
          Save key
        </SaveBtn>
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>

      <div style={{ backgroundColor: OFF_WHITE, border: `0.5px solid ${BORDER}`, padding: '14px 18px' }}>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT, margin: '0 0 8px' }}>How to share with staff</p>
        <ol style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0, paddingLeft: 18, lineHeight: 2.2 }}>
          <li>Send staff the <span style={{ fontWeight: 400, color: TEXT }}>Staff page</span> link above</li>
          <li>They enter the key: <span style={{ fontFamily: "'Courier New', monospace", color: BURG, fontWeight: 400 }}>{key || '-'}</span></li>
          <li>Type their name to filter to just their appointments</li>
        </ol>
      </div>
    </div>
  )
}

// ── Policy helpers ────────────────────────────────────────────────────────────

function PolicyRadio({ label, value, current, onChange, children }) {
  const selected = current === value
  return (
    <div>
      <button
        type="button"
        onClick={() => onChange(value)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{
          width: 14, height: 14,
          border: `1.5px solid ${selected ? BURG : BORDER}`,
          backgroundColor: selected ? BURG : 'transparent',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.1s, background-color 0.1s',
        }}>
          {selected && <div style={{ width: 4, height: 4, backgroundColor: '#fff' }} />}
        </div>
        <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: TEXT }}>{label}</span>
      </button>
      {selected && children}
    </div>
  )
}

function CheckItem({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <div style={{
        width: 14, height: 14,
        border: `1.5px solid ${checked ? BURG : BORDER}`,
        backgroundColor: checked ? BURG : 'transparent',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.1s, background-color 0.1s',
      }}>
        {checked && <Check size={9} color="#fff" />}
      </div>
      <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: TEXT }}>{label}</span>
    </button>
  )
}

function OtherTextInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Describe your policy…"
      style={{ ...fieldStyle, marginTop: 8, marginLeft: 26, width: 'calc(100% - 26px)', boxSizing: 'border-box' }}
      onFocus={(e) => (e.target.style.borderColor = BURG)}
      onBlur={(e) => (e.target.style.borderColor = BORDER)}
    />
  )
}

function PolicyGroup({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>{title}</p>
      {children}
    </div>
  )
}

// ── AI assistant policies ─────────────────────────────────────────────────────

function BusinessPoliciesCard({ current }) {
  const [saved, setSaved] = useState(false)

  const init = (p) => ({
    cancellationPolicy: p?.cancellationPolicy || '',
    cancellationOther: '',
    lateArrivalPolicy: p?.lateArrivalPolicy || '',
    lateArrivalOther: '',
    lateFee: p?.lateFee?.startsWith('Late fee applies') ? 'fee_applies'
           : p?.lateFee === 'No charge, we accommodate late arrivals' ? 'no_charge'
           : p?.lateFee === 'Appointment cancelled and deposit forfeited' ? 'deposit_forfeited'
           : p?.lateFee ? 'other' : '',
    lateFeeAmount: p?.lateFee?.match(/ZMW (\d+)/)?.[1] || '',
    lateFeeOther: (!['no_charge','fee_applies','deposit_forfeited',''].includes(
      p?.lateFee?.startsWith('Late fee applies') ? 'fee_applies'
      : p?.lateFee === 'No charge, we accommodate late arrivals' ? 'no_charge'
      : p?.lateFee === 'Appointment cancelled and deposit forfeited' ? 'deposit_forfeited'
      : p?.lateFee ? 'other' : ''
    )) ? (p?.lateFee || '') : '',
    waitingTime: p?.waitingTime || '',
    waitingOther: '',
    whatToBring: p?.whatToBring || [],
    whatToBringOther: '',
    walkIns: p?.walkIns || '',
    walkInsOther: '',
    depositPolicy: p?.depositPolicy || '',
    depositPolicyOther: '',
    refundPolicy: p?.refundPolicy || '',
    refundPolicyOther: '',
    balancePaymentMethod: p?.balancePaymentMethod || '',
    balancePaymentMethodOther: '',
    howToFindUs: p?.howToFindUs || '',
    contactPreference: p?.contactPreference || '',
    contactOther: '',
    additionalInfo: p?.additionalInfo || '',
  })

  const [form, setForm] = useState(() => init(current))
  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }
  function toggleBring(item) {
    setForm((f) => ({
      ...f,
      whatToBring: f.whatToBring.includes(item)
        ? f.whatToBring.filter((i) => i !== item)
        : [...f.whatToBring, item],
    }))
  }

  const [updatePolicies, { loading, error }] = useMutation(UPDATE_BUSINESS_POLICIES, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  function save() {
    const lateFeeText =
      form.lateFee === 'fee_applies' && form.lateFeeAmount
        ? `Late fee applies: ZMW ${form.lateFeeAmount}`
        : form.lateFee === 'other' ? form.lateFeeOther
        : form.lateFee === 'no_charge' ? 'No charge, we accommodate late arrivals'
        : form.lateFee === 'deposit_forfeited' ? 'Appointment cancelled and deposit forfeited'
        : form.lateFee

    const whatToBring = [
      ...form.whatToBring.filter((i) => i !== 'other'),
      ...(form.whatToBring.includes('other') && form.whatToBringOther ? [form.whatToBringOther] : []),
    ]

    updatePolicies({
      variables: {
        policies: {
          cancellationPolicy: form.cancellationPolicy === 'other' ? form.cancellationOther : form.cancellationPolicy,
          lateArrivalPolicy: form.lateArrivalPolicy === 'other' ? form.lateArrivalOther : form.lateArrivalPolicy,
          lateFee: lateFeeText || '',
          waitingTime: form.waitingTime === 'other' ? form.waitingOther : form.waitingTime,
          whatToBring,
          walkIns: form.walkIns === 'other' ? form.walkInsOther : form.walkIns,
          depositPolicy: form.depositPolicy === 'other' ? form.depositPolicyOther : form.depositPolicy,
          refundPolicy: form.refundPolicy === 'other' ? form.refundPolicyOther : form.refundPolicy,
          balancePaymentMethod: form.balancePaymentMethod === 'other' ? form.balancePaymentMethodOther : form.balancePaymentMethod,
          howToFindUs: form.howToFindUs,
          contactPreference: form.contactPreference === 'other' ? form.contactOther : form.contactPreference,
          additionalInfo: form.additionalInfo,
        },
      },
    })
  }

  const isCancOther    = form.cancellationPolicy === 'other'
  const isLateOther    = form.lateArrivalPolicy === 'other'
  const isFeeOther     = form.lateFee === 'other'
  const isWaitOther    = form.waitingTime === 'other'
  const isBringOther   = form.whatToBring.includes('other')
  const isWalkOther    = form.walkIns === 'other'
  const isDepositOther = form.depositPolicy === 'other'
  const isRefundOther  = form.refundPolicy === 'other'
  const isBalanceOther = form.balancePaymentMethod === 'other'
  const isContOther    = form.contactPreference === 'other'

  const divider = { borderTop: `0.5px solid ${BORDER}`, paddingTop: 20 }

  return (
    <div style={{ ...cardStyle, gap: 24 }}>
      <div>
        <h2 style={headingStyle}>
          <Bot size={18} color={BURG} />
          AI assistant policies
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          These policies help your AI booking assistant answer common customer questions accurately.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PolicyGroup title="Cancellation policy">
          {['Free cancellation anytime', 'Free cancellation up to 24hrs before', 'Deposit non-refundable on cancellation'].map((opt) => (
            <PolicyRadio key={opt} label={opt} value={opt} current={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)} />
          ))}
          <PolicyRadio label="Other" value="other" current={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)}>
            {isCancOther && <OtherTextInput value={form.cancellationOther} onChange={(v) => set('cancellationOther', v)} />}
          </PolicyRadio>
        </PolicyGroup>

        <div style={divider}>
          <PolicyGroup title="Late arrival policy">
            {['We allow up to 15 minutes late', 'We allow up to 30 minutes late', 'No late arrivals, appointment cancelled if late'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.lateArrivalPolicy} onChange={(v) => set('lateArrivalPolicy', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.lateArrivalPolicy} onChange={(v) => set('lateArrivalPolicy', v)}>
              {isLateOther && <OtherTextInput value={form.lateArrivalOther} onChange={(v) => set('lateArrivalOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Late fee">
            <PolicyRadio label="No charge, we accommodate late arrivals" value="no_charge" current={form.lateFee} onChange={(v) => set('lateFee', v)} />
            <PolicyRadio label="Yes, a late fee applies" value="fee_applies" current={form.lateFee} onChange={(v) => set('lateFee', v)}>
              <div style={{ marginTop: 8, marginLeft: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>ZMW</span>
                <input
                  type="number"
                  min="0"
                  value={form.lateFeeAmount}
                  onChange={(e) => set('lateFeeAmount', e.target.value)}
                  placeholder="Amount"
                  style={{ width: 100, padding: '7px 10px', border: `0.5px solid ${BORDER}`, fontFamily: sans, fontSize: 13, fontWeight: 300, color: TEXT, backgroundColor: '#fff', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = BURG)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
              </div>
            </PolicyRadio>
            <PolicyRadio label="Appointment cancelled and deposit forfeited" value="deposit_forfeited" current={form.lateFee} onChange={(v) => set('lateFee', v)} />
            <PolicyRadio label="Other" value="other" current={form.lateFee} onChange={(v) => set('lateFee', v)}>
              {isFeeOther && <OtherTextInput value={form.lateFeeOther} onChange={(v) => set('lateFeeOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="How long should customers expect to wait if running behind?">
            {['We run on time, no waiting', 'Allow up to 15 minutes waiting time', 'Allow up to 30 minutes waiting time'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.waitingTime} onChange={(v) => set('waitingTime', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.waitingTime} onChange={(v) => set('waitingTime', v)}>
              {isWaitOther && <OtherTextInput value={form.waitingOther} onChange={(v) => set('waitingOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="What should customers bring? (select all that apply)">
            {['Reference photos', 'Their own hair extensions', 'Their own nail polish colour', 'Nothing, we provide everything'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.whatToBring.includes(opt)} onChange={() => toggleBring(opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isBringOther} onChange={() => toggleBring('other')} />
              {isBringOther && <OtherTextInput value={form.whatToBringOther} onChange={(v) => set('whatToBringOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Walk-ins">
            {['We accept walk-ins', 'Appointment only, no walk-ins', 'Walk-ins accepted if a slot is open'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.walkIns} onChange={(v) => set('walkIns', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.walkIns} onChange={(v) => set('walkIns', v)}>
              {isWalkOther && <OtherTextInput value={form.walkInsOther} onChange={(v) => set('walkInsOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Deposit policy">
            {[
              'Deposit refunded if cancelled with notice, forfeited on no-show',
              'Deposit always forfeited once paid, no exceptions',
              'Deposit transferable to a new date if rescheduled in time',
              'Deposit fully refundable anytime before the appointment',
            ].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.depositPolicy} onChange={(v) => set('depositPolicy', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.depositPolicy} onChange={(v) => set('depositPolicy', v)}>
              {isDepositOther && <OtherTextInput value={form.depositPolicyOther} onChange={(v) => set('depositPolicyOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Refund / redo policy">
            {[
              "We offer a free redo if you're not satisfied",
              'Redo available within 3 days',
              "No refunds, but we'll address concerns",
              'Refunds considered case by case',
            ].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.refundPolicy} onChange={(v) => set('refundPolicy', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.refundPolicy} onChange={(v) => set('refundPolicy', v)}>
              {isRefundOther && <OtherTextInput value={form.refundPolicyOther} onChange={(v) => set('refundPolicyOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Balance payment method at the salon">
            {['Cash only', 'Mobile money accepted', 'Cash or mobile money'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.balancePaymentMethod} onChange={(v) => set('balancePaymentMethod', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.balancePaymentMethod} onChange={(v) => set('balancePaymentMethod', v)}>
              {isBalanceOther && <OtherTextInput value={form.balancePaymentMethodOther} onChange={(v) => set('balancePaymentMethodOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>How to find us (optional)</p>
          <textarea
            value={form.howToFindUs}
            onChange={(e) => set('howToFindUs', e.target.value)}
            placeholder="e.g. Look for the blue gate next to XYZ shop, second floor."
            rows={2}
            style={{ ...fieldStyle, resize: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>

        <div style={divider}>
          <PolicyGroup title="Customer contact preference">
            {['Kimawa only', 'WhatsApp also welcome', 'Call us anytime'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.contactPreference} onChange={(v) => set('contactPreference', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.contactPreference} onChange={(v) => set('contactPreference', v)}>
              {isContOther && <OtherTextInput value={form.contactOther} onChange={(v) => set('contactOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>Additional info (optional)</p>
          <textarea
            value={form.additionalInfo}
            onChange={(e) => set('additionalInfo', e.target.value)}
            placeholder="e.g. We specialise in natural African hair, by appointment only, etc."
            rows={3}
            style={{ ...fieldStyle, resize: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
        <SaveBtn onClick={save} loading={loading}>Save policies</SaveBtn>
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { data, loading, error } = useQuery(SALON_SETTINGS)

  return (
    <PageWrapper>
      <PageHeader title="Settings" subtitle="Manage your salon configuration" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data && (
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <BusinessProfileCard currentImageUrl={data.salonSettings.coverImageUrl} />
          <LocationCard
            currentCity={data.salonSettings.city}
            currentArea={data.salonSettings.area}
            currentAddress={data.salonSettings.address}
          />
          <OpeningHoursCard current={data.salonSettings.openingHours} />
          <StaffKeyCard currentKey={data.salonSettings.staffAccessKey} />
          <BusinessPoliciesCard current={data.salonSettings.businessPolicies} />
        </div>
      )}
    </PageWrapper>
  )
}
