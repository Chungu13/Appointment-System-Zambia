import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Check, Camera, X, FileText, MapPin, Clock } from 'lucide-react'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { UPDATE_TENANT_PROFILE, UPDATE_BUSINESS_POLICIES, UPDATE_OPENING_HOURS } from '../../graphql/mutations/tenant'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

const BURG      = '#3B2A1E'
const TEXT      = '#241812'
const MUTED     = '#5C4C3D'
const HINT      = '#8A7A6A'
const BORDER    = '#EDE3D6'
const BLUSH     = '#FBF7F1'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

const cardStyle = {
  backgroundColor: '#fff',
  border: `0.5px solid ${BORDER}`,
  borderRadius: 14,
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
  border: '1.5px solid #C9B49C',
  borderRadius: 10,
  fontFamily: sans,
  fontSize: 13,
  fontWeight: 300,
  color: TEXT,
  backgroundColor: '#fff',
  outline: 'none',
}

const savedSpan = { fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#2d6a4f' }

// Report a section's unsaved state up to the page, so switching away can warn
// instead of silently discarding edits. Cleans up on unmount so a section that
// is navigated away from never leaves the page stuck on "dirty".
function useReportDirty(onDirty, dirty) {
  useEffect(() => {
    onDirty?.(dirty)
    return () => onDirty?.(false)
  }, [onDirty, dirty])
}

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
        borderRadius: 10,
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
            style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block', border: `0.5px solid ${BORDER}`, borderRadius: 12 }}
          />
          <button
            onClick={removePhoto}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, color: '#fff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
            borderRadius: 12,
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

function LocationCard({ currentCity, currentArea, currentAddress, onDirty }) {
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

  useReportDirty(onDirty,
    city !== (currentCity || 'Lusaka')
    || effectiveArea !== (currentArea || '')
    || address !== (currentAddress || ''),
  )

  function handleCityChange(e) {
    setCity(e.target.value)
    setArea('')
    setAreaOther('')
  }

  function save() {
    updateProfile({ variables: { city, area: effectiveArea, address: address.trim() } })
  }

  const onFocus = (e) => (e.target.style.borderColor = BURG)
  const onBlur  = (e) => (e.target.style.borderColor = '#C9B49C')

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

function OpeningHoursCard({ current, onDirty }) {
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

  useReportDirty(onDirty, rows.some((r) => {
    const row = (current ?? []).find((h) => h.dayOfWeek === r.dayOfWeek)
    return r.closed !== (row?.closed ?? false)
      || (!r.closed && (r.opens !== (row?.opens || '08:00') || r.closes !== (row?.closes || '18:00')))
  }))

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

// ── Policy helpers ────────────────────────────────────────────────────────────

function CheckItem({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <div style={{
        width: 14, height: 14,
        borderRadius: 4,
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
      onBlur={(e) => (e.target.style.borderColor = '#C9B49C')}
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

// ── Booking policies ───────────────────────────────────────────────────────────

// Legacy saved policies were a single string per section; wrap those as a
// one-item list so older tenants load cleanly into the new multi-select form.
function toList(v) {
  if (Array.isArray(v)) return v
  return v ? [v] : []
}

function classifyLateFee(text) {
  if (text.startsWith('Late fee applies')) return 'fee_applies'
  if (text === 'No charge, we accommodate late arrivals') return 'no_charge'
  if (text === 'Appointment cancelled and deposit forfeited') return 'deposit_forfeited'
  return 'other'
}

function BusinessPoliciesCard({ current, onDirty }) {
  const [saved, setSaved] = useState(false)

  const init = (p) => {
    const lateFeeRaw = toList(p?.lateFee)
    const lateFeeKeys = lateFeeRaw.map(classifyLateFee)
    const feeAppliesText = lateFeeRaw.find((t) => t.startsWith('Late fee applies')) || ''
    return {
      cancellationPolicy: toList(p?.cancellationPolicy),
      cancellationOther: '',
      lateArrivalPolicy: toList(p?.lateArrivalPolicy),
      lateArrivalOther: '',
      lateFee: lateFeeKeys,
      lateFeeAmount: feeAppliesText.match(/ZMW (\d+)/)?.[1] || '',
      lateFeeOther: lateFeeRaw.find((t, i) => lateFeeKeys[i] === 'other') || '',
      waitingTime: toList(p?.waitingTime),
      waitingOther: '',
      whatToBring: p?.whatToBring || [],
      whatToBringOther: '',
      walkIns: toList(p?.walkIns),
      walkInsOther: '',
      depositPolicy: toList(p?.depositPolicy),
      depositPolicyOther: '',
      refundPolicy: toList(p?.refundPolicy),
      refundPolicyOther: '',
      balancePaymentMethod: toList(p?.balancePaymentMethod),
      balancePaymentMethodOther: '',
      howToFindUs: p?.howToFindUs || '',
      contactPreference: toList(p?.contactPreference),
      contactOther: '',
      additionalInfo: p?.additionalInfo || '',
    }
  }

  const [form, setForm] = useState(() => init(current))
  useReportDirty(onDirty, JSON.stringify(form) !== JSON.stringify(init(current)))
  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }
  function toggle(key, item) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter((i) => i !== item) : [...f[key], item],
    }))
  }

  const [updatePolicies, { loading, error }] = useMutation(UPDATE_BUSINESS_POLICIES, {
    refetchQueries: [SALON_SETTINGS],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  // Selected checkbox values are stored verbatim except "other", which is
  // swapped for the salon's own typed-in text (or dropped if left blank).
  function resolveOther(list, otherText) {
    return [
      ...list.filter((i) => i !== 'other'),
      ...(list.includes('other') && otherText ? [otherText] : []),
    ]
  }

  function save() {
    const lateFeeTexts = form.lateFee.map((key) => {
      if (key === 'fee_applies') return form.lateFeeAmount ? `Late fee applies: ZMW ${form.lateFeeAmount}` : 'Late fee applies'
      if (key === 'no_charge') return 'No charge, we accommodate late arrivals'
      if (key === 'deposit_forfeited') return 'Appointment cancelled and deposit forfeited'
      if (key === 'other') return form.lateFeeOther
      return null
    }).filter(Boolean)

    updatePolicies({
      variables: {
        policies: {
          cancellationPolicy: resolveOther(form.cancellationPolicy, form.cancellationOther),
          lateArrivalPolicy: resolveOther(form.lateArrivalPolicy, form.lateArrivalOther),
          lateFee: lateFeeTexts,
          waitingTime: resolveOther(form.waitingTime, form.waitingOther),
          whatToBring: resolveOther(form.whatToBring, form.whatToBringOther),
          walkIns: resolveOther(form.walkIns, form.walkInsOther),
          depositPolicy: resolveOther(form.depositPolicy, form.depositPolicyOther),
          refundPolicy: resolveOther(form.refundPolicy, form.refundPolicyOther),
          balancePaymentMethod: resolveOther(form.balancePaymentMethod, form.balancePaymentMethodOther),
          howToFindUs: form.howToFindUs,
          contactPreference: resolveOther(form.contactPreference, form.contactOther),
          additionalInfo: form.additionalInfo,
        },
      },
    })
  }

  const isCancOther    = form.cancellationPolicy.includes('other')
  const isLateOther    = form.lateArrivalPolicy.includes('other')
  const isFeeOther     = form.lateFee.includes('other')
  const isFeeApplies   = form.lateFee.includes('fee_applies')
  const isWaitOther    = form.waitingTime.includes('other')
  const isBringOther   = form.whatToBring.includes('other')
  const isWalkOther    = form.walkIns.includes('other')
  const isDepositOther = form.depositPolicy.includes('other')
  const isRefundOther  = form.refundPolicy.includes('other')
  const isBalanceOther = form.balancePaymentMethod.includes('other')
  const isContOther    = form.contactPreference.includes('other')

  const divider = { borderTop: `0.5px solid ${BORDER}`, paddingTop: 20 }

  return (
    <div style={{ ...cardStyle, gap: 24 }}>
      <div>
        <h2 style={headingStyle}>
          <FileText size={18} color={BURG} />
          Booking policies
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          Select all that apply for each section - these show on your booking page so customers know what to expect.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PolicyGroup title="Cancellation policy (select all that apply)">
          {['Free cancellation anytime', 'Free cancellation up to 24hrs before', 'Deposit non-refundable on cancellation'].map((opt) => (
            <CheckItem key={opt} label={opt} checked={form.cancellationPolicy.includes(opt)} onChange={() => toggle('cancellationPolicy', opt)} />
          ))}
          <div>
            <CheckItem label="Other" checked={isCancOther} onChange={() => toggle('cancellationPolicy', 'other')} />
            {isCancOther && <OtherTextInput value={form.cancellationOther} onChange={(v) => set('cancellationOther', v)} />}
          </div>
        </PolicyGroup>

        <div style={divider}>
          <PolicyGroup title="Late arrival policy (select all that apply)">
            {['We allow up to 15 minutes late', 'We allow up to 30 minutes late', 'No late arrivals, appointment cancelled if late'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.lateArrivalPolicy.includes(opt)} onChange={() => toggle('lateArrivalPolicy', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isLateOther} onChange={() => toggle('lateArrivalPolicy', 'other')} />
              {isLateOther && <OtherTextInput value={form.lateArrivalOther} onChange={(v) => set('lateArrivalOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Late fee (select all that apply)">
            <CheckItem label="No charge, we accommodate late arrivals" checked={form.lateFee.includes('no_charge')} onChange={() => toggle('lateFee', 'no_charge')} />
            <div>
              <CheckItem label="Yes, a late fee applies" checked={isFeeApplies} onChange={() => toggle('lateFee', 'fee_applies')} />
              {isFeeApplies && (
                <div style={{ marginTop: 8, marginLeft: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>ZMW</span>
                  <input
                    type="number"
                    min="0"
                    value={form.lateFeeAmount}
                    onChange={(e) => set('lateFeeAmount', e.target.value)}
                    placeholder="Amount"
                    style={{ width: 100, padding: '7px 10px', border: '1.5px solid #C9B49C', borderRadius: 8, fontFamily: sans, fontSize: 13, fontWeight: 300, color: TEXT, backgroundColor: '#fff', outline: 'none' }}
                    onFocus={(e) => (e.target.style.borderColor = BURG)}
                    onBlur={(e) => (e.target.style.borderColor = '#C9B49C')}
                  />
                </div>
              )}
            </div>
            <CheckItem label="Appointment cancelled and deposit forfeited" checked={form.lateFee.includes('deposit_forfeited')} onChange={() => toggle('lateFee', 'deposit_forfeited')} />
            <div>
              <CheckItem label="Other" checked={isFeeOther} onChange={() => toggle('lateFee', 'other')} />
              {isFeeOther && <OtherTextInput value={form.lateFeeOther} onChange={(v) => set('lateFeeOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="How long should customers expect to wait if running behind? (select all that apply)">
            {['We run on time, no waiting', 'Allow up to 15 minutes waiting time', 'Allow up to 30 minutes waiting time'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.waitingTime.includes(opt)} onChange={() => toggle('waitingTime', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isWaitOther} onChange={() => toggle('waitingTime', 'other')} />
              {isWaitOther && <OtherTextInput value={form.waitingOther} onChange={(v) => set('waitingOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="What should customers bring? (select all that apply)">
            {['Reference photos', 'Their own hair extensions', 'Their own nail polish colour', 'Nothing, we provide everything'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.whatToBring.includes(opt)} onChange={() => toggle('whatToBring', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isBringOther} onChange={() => toggle('whatToBring', 'other')} />
              {isBringOther && <OtherTextInput value={form.whatToBringOther} onChange={(v) => set('whatToBringOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Walk-ins (select all that apply)">
            {['We accept walk-ins', 'Appointment only, no walk-ins', 'Walk-ins accepted if a slot is open'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.walkIns.includes(opt)} onChange={() => toggle('walkIns', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isWalkOther} onChange={() => toggle('walkIns', 'other')} />
              {isWalkOther && <OtherTextInput value={form.walkInsOther} onChange={(v) => set('walkInsOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Deposit policy (select all that apply)">
            {[
              'Deposit refunded if cancelled with notice, forfeited on no-show',
              'Deposit always forfeited once paid, no exceptions',
              'Deposit transferable to a new date if rescheduled in time',
              'Deposit fully refundable anytime before the appointment',
            ].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.depositPolicy.includes(opt)} onChange={() => toggle('depositPolicy', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isDepositOther} onChange={() => toggle('depositPolicy', 'other')} />
              {isDepositOther && <OtherTextInput value={form.depositPolicyOther} onChange={(v) => set('depositPolicyOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Refund / redo policy (select all that apply)">
            {[
              "We offer a free redo if you're not satisfied",
              'Redo available within 3 days',
              "No refunds, but we'll address concerns",
              'Refunds considered case by case',
            ].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.refundPolicy.includes(opt)} onChange={() => toggle('refundPolicy', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isRefundOther} onChange={() => toggle('refundPolicy', 'other')} />
              {isRefundOther && <OtherTextInput value={form.refundPolicyOther} onChange={(v) => set('refundPolicyOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        <div style={divider}>
          <PolicyGroup title="Balance payment method at the salon (select all that apply)">
            {['Cash only', 'Mobile money accepted', 'Cash or mobile money'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.balancePaymentMethod.includes(opt)} onChange={() => toggle('balancePaymentMethod', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isBalanceOther} onChange={() => toggle('balancePaymentMethod', 'other')} />
              {isBalanceOther && <OtherTextInput value={form.balancePaymentMethodOther} onChange={(v) => set('balancePaymentMethodOther', v)} />}
            </div>
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
            onBlur={(e) => (e.target.style.borderColor = '#C9B49C')}
          />
        </div>

        <div style={divider}>
          <PolicyGroup title="Customer contact preference (select all that apply)">
            {['Kimawa only', 'WhatsApp also welcome', 'Call us anytime'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.contactPreference.includes(opt)} onChange={() => toggle('contactPreference', opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isContOther} onChange={() => toggle('contactPreference', 'other')} />
              {isContOther && <OtherTextInput value={form.contactOther} onChange={(v) => set('contactOther', v)} />}
            </div>
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
            onBlur={(e) => (e.target.style.borderColor = '#C9B49C')}
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

const SECTIONS = [
  { key: 'profile',  label: 'Profile' },
  { key: 'location', label: 'Location' },
  { key: 'hours',    label: 'Hours' },
  { key: 'policies', label: 'Policies' },
]

function settingsPill(active) {
  return {
    fontFamily: sans, fontSize: 13, fontWeight: 500,
    padding: '10px 18px', borderRadius: 999, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.1s',
    backgroundColor: active ? BURG : '#fff',
    color: active ? '#fff' : TEXT,
    border: active ? 'none' : `0.5px solid ${BORDER}`,
  }
}

export default function Settings() {
  const { data, loading, error } = useQuery(SALON_SETTINGS)
  const [section, setSection] = useState('profile')
  const [dirty, setDirty] = useState(false)

  // Each section holds its edits in local state until saved, so leaving one
  // with unsaved changes would drop them without a trace. Ask first.
  function goTo(next) {
    if (next === section) return
    if (dirty && !window.confirm('You have unsaved changes here. Leave without saving?')) return
    setDirty(false)
    setSection(next)
  }

  const s = data?.salonSettings

  return (
    <PageWrapper>
      <PageHeader title="Settings" subtitle="Manage your salon configuration" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {s && (
        <div style={{ maxWidth: 560 }}>
          <div
            className="settings-pill-row"
            style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, marginBottom: 24 }}
          >
            {SECTIONS.map((t) => (
              <button key={t.key} type="button" onClick={() => goTo(t.key)} style={settingsPill(section === t.key)}>
                {t.label}
                {dirty && section === t.key && ' •'}
              </button>
            ))}
          </div>
          <style>{`.settings-pill-row::-webkit-scrollbar { display: none; }`}</style>

          {section === 'profile'  && <BusinessProfileCard currentImageUrl={s.coverImageUrl} />}
          {section === 'location' && (
            <LocationCard
              currentCity={s.city}
              currentArea={s.area}
              currentAddress={s.address}
              onDirty={setDirty}
            />
          )}
          {section === 'hours'    && <OpeningHoursCard current={s.openingHours} onDirty={setDirty} />}
          {section === 'policies' && <BusinessPoliciesCard current={s.businessPolicies} onDirty={setDirty} />}
        </div>
      )}
    </PageWrapper>
  )
}
