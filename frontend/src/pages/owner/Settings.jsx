import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { KeyRound, Copy, Check, RefreshCw, Camera, X, Bot, MapPin } from 'lucide-react'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { SET_STAFF_ACCESS_KEY, UPDATE_TENANT_PROFILE, UPDATE_BUSINESS_POLICIES } from '../../graphql/mutations/tenant'
import { CITIES, LUSAKA_AREAS } from '../../lib/locations'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

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

  function handleFileChange(e) {
    processFile(e.target.files?.[0])
  }

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
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-on-surface flex items-center gap-2">
          <Camera size={18} className="text-primary" />
          Business profile photo
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          This photo appears on your public salon listing in the directory.
        </p>
      </div>

      {validationError && (
        <p className="text-sm text-error font-medium">{validationError}</p>
      )}

      {preview ? (
        <div className="relative w-full max-w-sm">
          <img
            src={preview}
            alt="Business cover"
            className="w-full h-48 object-cover rounded-xl border border-outline-variant"
          />
          <button
            onClick={removePhoto}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <X size={16} />
          </button>
          {loading && (
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-medium">Saving…</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full max-w-sm h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container'
          }`}
        >
          <Camera size={28} className="text-on-surface-variant" />
          <span className="text-sm text-on-surface-variant">
            Click or drag a photo here
          </span>
          <span className="text-xs text-on-surface-variant/70">JPG or PNG, max 5 MB</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {saved && <span className="text-sm text-green-700 font-medium">Saved ✓</span>}
    </div>
  )
}

function LocationCard({ currentCity, currentArea, currentAddress }) {
  const [city, setCity]         = useState(currentCity || 'Lusaka')
  const [area, setArea]         = useState(currentArea || '')
  const [areaOther, setAreaOther] = useState('')
  const [address, setAddress]   = useState(currentAddress || '')
  const [saved, setSaved]       = useState(false)

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

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-on-surface flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Location
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Shown on your public listing so customers can find you.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">City</label>
          <select
            value={city}
            onChange={handleCityChange}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
          >
            {CITIES.filter((c) => c !== 'Other').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            {isLusaka ? 'Area (Lusaka neighbourhood)' : 'Area / suburb'}
          </label>
          {isLusaka ? (
            <>
              <select
                value={area}
                onChange={(e) => { setArea(e.target.value); setAreaOther('') }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
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
                  className="mt-2 w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
                />
              )}
            </>
          ) : (
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Riverside, CBD"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Detailed address / directions
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop 4, Cairo Road, next to Game"
            rows={2}
            className="w-full rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={loading}>Save location</Button>
        {saved && <span className="text-sm text-green-700 font-medium">Saved ✓</span>}
      </div>
    </div>
  )
}

function generateKey() {
  const words = ['GLOW', 'SALON', 'BEAUTY', 'SHINE', 'STYLE', 'GRACE']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}${num}`
}

function StaffKeyCard({ currentKey }) {
  const [key, setKey] = useState(currentKey || '')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-on-surface flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          Staff access key
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Share this key with your staff. They enter it at{' '}
          <span className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded">
            {window.location.origin}/staff
          </span>{' '}
          to see today's schedule — no individual accounts needed.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div className="flex gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="e.g. GLOW2024"
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-lg font-bold tracking-widest uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        />
        <button
          onClick={copy}
          title="Copy key"
          className="px-3 rounded-xl border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
        </button>
        <button
          onClick={() => setKey(generateKey())}
          title="Generate new key"
          className="px-3 rounded-xl border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={loading} disabled={!key.trim() || key.trim() === currentKey}>
          Save key
        </Button>
        {saved && <span className="text-sm text-green-700 font-medium">Saved ✓</span>}
      </div>

      <div className="rounded-xl bg-primary-container/30 border border-primary/20 p-4 text-sm">
        <p className="font-semibold text-on-surface mb-1">How to share with staff</p>
        <ol className="text-on-surface-variant space-y-1 list-decimal list-inside">
          <li>Tell all staff: "Go to <span className="font-medium text-on-surface">{window.location.origin}/staff</span>"</li>
          <li>Enter the key: <span className="font-mono font-bold text-primary">{key || '—'}</span></li>
          <li>Type your name to filter to just your appointments</li>
        </ol>
      </div>
    </div>
  )
}

// ── Radio helper ──────────────────────────────────────────────────────────────
function PolicyRadio({ label, value, current, onChange, children }) {
  const selected = current === value
  return (
    <div>
      <button
        type="button"
        onClick={() => onChange(value)}
        className="flex items-center gap-3 text-left w-full"
      >
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'border-primary' : 'border-outline-variant'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>
        <span className="text-sm text-on-surface">{label}</span>
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
      className="flex items-center gap-3 text-left w-full"
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-outline-variant'
      }`}>
        {checked && <Check size={10} className="text-white" />}
      </div>
      <span className="text-sm text-on-surface">{label}</span>
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
      className="mt-2 ml-7 w-full rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors"
    />
  )
}

function PolicyGroup({ title, children }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-on-surface">{title}</p>
      {children}
    </div>
  )
}

function BusinessPoliciesCard({ current }) {
  const [saved, setSaved] = useState(false)

  // Flatten DB policies into local state
  const init = (p) => ({
    cancellationPolicy: p?.cancellationPolicy || '',
    cancellationOther: '',
    lateArrivalPolicy: p?.lateArrivalPolicy || '',
    lateArrivalOther: '',
    lateFee: p?.lateFee?.startsWith('Late fee applies') ? 'fee_applies'
           : p?.lateFee === 'No charge — we accommodate late arrivals' ? 'no_charge'
           : p?.lateFee === 'Appointment cancelled and deposit forfeited' ? 'deposit_forfeited'
           : p?.lateFee ? 'other' : '',
    lateFeeAmount: p?.lateFee?.match(/ZMW (\d+)/)?.[1] || '',
    lateFeeOther: (!['no_charge','fee_applies','deposit_forfeited',''].includes(
      p?.lateFee?.startsWith('Late fee applies') ? 'fee_applies'
      : p?.lateFee === 'No charge — we accommodate late arrivals' ? 'no_charge'
      : p?.lateFee === 'Appointment cancelled and deposit forfeited' ? 'deposit_forfeited'
      : p?.lateFee ? 'other' : ''
    )) ? (p?.lateFee || '') : '',
    waitingTime: p?.waitingTime || '',
    waitingOther: '',
    whatToBring: p?.whatToBring || [],
    whatToBringOther: '',
    parking: p?.parking || '',
    parkingOther: '',
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
        : form.lateFee === 'no_charge' ? 'No charge — we accommodate late arrivals'
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
          parking: form.parking === 'other' ? form.parkingOther : form.parking,
          contactPreference: form.contactPreference === 'other' ? form.contactOther : form.contactPreference,
          additionalInfo: form.additionalInfo,
        },
      },
    })
  }

  const isCancOther = form.cancellationPolicy === 'other'
  const isLateOther = form.lateArrivalPolicy === 'other'
  const isFeeOther  = form.lateFee === 'other'
  const isWaitOther = form.waitingTime === 'other'
  const isBringOther = form.whatToBring.includes('other')
  const isParkOther  = form.parking === 'other'
  const isContOther  = form.contactPreference === 'other'

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-6">
      <div>
        <h2 className="font-semibold text-on-surface flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          AI assistant policies
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          These policies help your AI booking assistant answer common customer questions accurately.
        </p>
      </div>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div className="space-y-6 divide-y divide-outline-variant/40">
        {/* Cancellation */}
        <PolicyGroup title="Cancellation policy">
          {['Free cancellation anytime', 'Free cancellation up to 24hrs before', 'Deposit non-refundable on cancellation'].map((opt) => (
            <PolicyRadio key={opt} label={opt} value={opt} current={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)} />
          ))}
          <PolicyRadio label="Other" value="other" current={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)}>
            {isCancOther && <OtherTextInput value={form.cancellationOther} onChange={(v) => set('cancellationOther', v)} />}
          </PolicyRadio>
        </PolicyGroup>

        {/* Late arrival */}
        <div className="pt-5">
          <PolicyGroup title="Late arrival policy">
            {['We allow up to 15 minutes late', 'We allow up to 30 minutes late', 'No late arrivals — appointment cancelled if late'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.lateArrivalPolicy} onChange={(v) => set('lateArrivalPolicy', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.lateArrivalPolicy} onChange={(v) => set('lateArrivalPolicy', v)}>
              {isLateOther && <OtherTextInput value={form.lateArrivalOther} onChange={(v) => set('lateArrivalOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        {/* Late fee */}
        <div className="pt-5">
          <PolicyGroup title="Late fee">
            <PolicyRadio label="No charge — we accommodate late arrivals" value="no_charge" current={form.lateFee} onChange={(v) => set('lateFee', v)} />
            <PolicyRadio label="Yes — a late fee applies" value="fee_applies" current={form.lateFee} onChange={(v) => set('lateFee', v)}>
              <div className="mt-2 ml-7 flex items-center gap-2">
                <span className="text-sm text-on-surface-variant">ZMW</span>
                <input
                  type="number"
                  min="0"
                  value={form.lateFeeAmount}
                  onChange={(e) => set('lateFeeAmount', e.target.value)}
                  placeholder="Amount"
                  className="w-28 rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </PolicyRadio>
            <PolicyRadio label="Appointment cancelled and deposit forfeited" value="deposit_forfeited" current={form.lateFee} onChange={(v) => set('lateFee', v)} />
            <PolicyRadio label="Other" value="other" current={form.lateFee} onChange={(v) => set('lateFee', v)}>
              {isFeeOther && <OtherTextInput value={form.lateFeeOther} onChange={(v) => set('lateFeeOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        {/* Waiting time */}
        <div className="pt-5">
          <PolicyGroup title="How long should customers expect to wait if running behind?">
            {['We run on time — no waiting', 'Allow up to 15 minutes waiting time', 'Allow up to 30 minutes waiting time'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.waitingTime} onChange={(v) => set('waitingTime', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.waitingTime} onChange={(v) => set('waitingTime', v)}>
              {isWaitOther && <OtherTextInput value={form.waitingOther} onChange={(v) => set('waitingOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        {/* What to bring */}
        <div className="pt-5">
          <PolicyGroup title="What should customers bring? (select all that apply)">
            {['Reference photos', 'Their own hair extensions', 'Their own nail polish colour', 'Nothing — we provide everything'].map((opt) => (
              <CheckItem key={opt} label={opt} checked={form.whatToBring.includes(opt)} onChange={() => toggleBring(opt)} />
            ))}
            <div>
              <CheckItem label="Other" checked={isBringOther} onChange={() => toggleBring('other')} />
              {isBringOther && <OtherTextInput value={form.whatToBringOther} onChange={(v) => set('whatToBringOther', v)} />}
            </div>
          </PolicyGroup>
        </div>

        {/* Parking */}
        <div className="pt-5">
          <PolicyGroup title="Parking">
            {['Free parking on site', 'Paid parking nearby', 'Street parking available', 'No parking — public transport recommended'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.parking} onChange={(v) => set('parking', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.parking} onChange={(v) => set('parking', v)}>
              {isParkOther && <OtherTextInput value={form.parkingOther} onChange={(v) => set('parkingOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        {/* Contact preference */}
        <div className="pt-5">
          <PolicyGroup title="Customer contact preference">
            {['Kimawa only', 'WhatsApp also welcome', 'Call us anytime'].map((opt) => (
              <PolicyRadio key={opt} label={opt} value={opt} current={form.contactPreference} onChange={(v) => set('contactPreference', v)} />
            ))}
            <PolicyRadio label="Other" value="other" current={form.contactPreference} onChange={(v) => set('contactPreference', v)}>
              {isContOther && <OtherTextInput value={form.contactOther} onChange={(v) => set('contactOther', v)} />}
            </PolicyRadio>
          </PolicyGroup>
        </div>

        {/* Additional info */}
        <div className="pt-5">
          <p className="text-sm font-semibold text-on-surface mb-2">Additional info (optional)</p>
          <textarea
            value={form.additionalInfo}
            onChange={(e) => set('additionalInfo', e.target.value)}
            placeholder="e.g. We specialise in natural African hair, by appointment only, etc."
            rows={3}
            className="w-full rounded-xl border-2 border-outline-variant bg-background text-on-surface text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} loading={loading}>Save policies</Button>
        {saved && <span className="text-sm text-green-700 font-medium">Saved ✓</span>}
      </div>
    </div>
  )
}

export default function Settings() {
  const { data, loading, error } = useQuery(SALON_SETTINGS)

  return (
    <PageWrapper>
      <PageHeader title="Settings" subtitle="Manage your salon configuration" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data && (
        <div className="max-w-lg space-y-6">
          <BusinessProfileCard currentImageUrl={data.salonSettings.coverImageUrl} />
          <LocationCard
            currentCity={data.salonSettings.city}
            currentArea={data.salonSettings.area}
            currentAddress={data.salonSettings.address}
          />
          <StaffKeyCard currentKey={data.salonSettings.staffAccessKey} />
          <BusinessPoliciesCard current={data.salonSettings.businessPolicies} />
        </div>
      )}
    </PageWrapper>
  )
}
