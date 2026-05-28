import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client/react'
import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Check, Plus, Trash2, ChevronLeft, ChevronRight, Camera, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { setTokens, saveRole, getToken, getRefreshToken } from '../../lib/auth'
import { CREATE_SERVICE } from '../../graphql/mutations/services'
import { CREATE_STAFF, SET_WORKING_HOURS } from '../../graphql/mutations/staff'
import { UPDATE_TENANT_PROFILE, UPDATE_BUSINESS_POLICIES, COMPLETE_ONBOARDING } from '../../graphql/mutations/tenant'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'

const PRIMARY   = '#6B2737'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_CHIP = '#d4ecd4'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SERVICE_SUGGESTIONS = {
  salon:       ['Box Braids', 'Weave Install', 'Relaxer', 'Hair Colour', 'Blow Dry'],
  barbershop:  ['Fade Haircut', 'Shape Up', 'Beard Trim', 'Full Shave', 'Hair Wash'],
  nail_tech:   ['Gel Full Set', 'Acrylic Set', 'Manicure', 'Pedicure', 'Nail Art'],
  spa:         ['Deep Tissue Massage', 'Swedish Massage', 'Facial', 'Body Scrub', 'Hot Stone'],
  lash_studio: ['Classic Lash Extensions', 'Volume Lashes', 'Lash Lift', 'Brow Lamination', 'Brow Tint'],
  other:       ['Consultation', 'Treatment', 'Package Deal', 'Express Service'],
}

const SERVICE_CATEGORIES = [
  { value: 'braids',  label: 'Braids' },
  { value: 'hair',    label: 'Hair' },
  { value: 'nails',   label: 'Nails' },
  { value: 'massage', label: 'Massage' },
  { value: 'lashes',  label: 'Lashes & Brows' },
  { value: 'facial',  label: 'Facial & Skin' },
  { value: 'barber',  label: 'Barber' },
  { value: 'general', label: 'Other' },
]

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hrs', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
]

const STEP_LABELS = ['Business Hours', 'Your Services', 'Your Team', 'AI Policies', "You're Ready!"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function copyToClipboard(text, onSuccess) {
  navigator.clipboard.writeText(text)
    .then(onSuccess)
    .catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      onSuccess()
    })
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done   = n < step
        const active = n === step
        return (
          <div key={n} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{ backgroundColor: done || active ? PRIMARY : '#e5e7eb', color: done || active ? '#fff' : MUTED }}
              >
                {done ? <Check size={14} /> : n}
              </div>
              <span
                className="hidden sm:block text-xs mt-1 whitespace-nowrap"
                style={{ color: active ? PRIMARY : MUTED, fontWeight: active ? 600 : 400 }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className="w-10 sm:w-16 h-0.5 mx-1 mt-0 sm:-mt-5 transition-colors"
                style={{ backgroundColor: done ? PRIMARY : '#e5e7eb' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Business Hours ───────────────────────────────────────────────────
function ScheduleStep({ scheduleType, setScheduleType, sameHours, setSameHours }) {
  function toggleDay(i) {
    setSameHours((h) => ({
      ...h,
      days: h.days.includes(i) ? h.days.filter((d) => d !== i) : [...h.days, i],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: TEXT }}>
          Set your business hours
        </h2>
        <p className="text-sm" style={{ color: MUTED }}>You can always update this later in Settings.</p>
      </div>

      <div className="space-y-3">
        {[
          { val: 'same',       label: 'All staff work the same hours', desc: 'Simple: set one schedule for everyone' },
          { val: 'individual', label: 'Staff have different schedules', desc: 'Set hours per person when adding your team' },
        ].map(({ val, label, desc }) => (
          <button
            key={val}
            type="button"
            onClick={() => setScheduleType(val)}
            className="w-full text-left rounded-xl p-4 border-2 transition-colors"
            style={{ borderColor: scheduleType === val ? PRIMARY : '#e5e7eb', backgroundColor: scheduleType === val ? MINT : '#fff' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: scheduleType === val ? PRIMARY : '#d1d5db' }}
              >
                {scheduleType === val && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIMARY }} />}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: TEXT }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {scheduleType === 'same' && (
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: TEXT }}>Which days are you open?</p>
            <div className="flex flex-wrap gap-2">
              {DAYS_SHORT.map((day, i) => {
                const on = sameHours.days.includes(i)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: on ? PRIMARY : '#f3f4f6', color: on ? '#fff' : MUTED }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['start', 'Opens at'], ['end', 'Closes at']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: TEXT }}>{label}</label>
                <input
                  type="time"
                  value={sameHours[key]}
                  onChange={(e) => setSameHours((h) => ({ ...h, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none"
                  style={{ color: TEXT }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduleType === 'individual' && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: MINT, border: '1px solid #d4ecd4', color: MUTED }}>
          You'll set each team member's hours when you add them in Step 3.
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Services ─────────────────────────────────────────────────────────
function ServicesStep({ businessType, services, setServices }) {
  const blank = { name: '', category: 'general', durationMinutes: 60, priceZmw: '', depositZmw: '' }
  const [form, setForm] = useState(blank)
  const [formErr, setFormErr] = useState('')
  const suggestions = SERVICE_SUGGESTIONS[businessType] ?? SERVICE_SUGGESTIONS.other

  function addService() {
    if (!form.name.trim()) { setFormErr('Service name is required.'); return }
    if (!form.priceZmw || isNaN(Number(form.priceZmw))) { setFormErr('Enter a valid price.'); return }
    setFormErr('')
    setServices((s) => [...s, {
      name: form.name.trim(),
      category: form.category,
      durationMinutes: Number(form.durationMinutes),
      priceZmw: parseFloat(form.priceZmw),
      depositZmw: parseFloat(form.depositZmw) || 0,
    }])
    setForm(blank)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: TEXT }}>Add your services</h2>
        <p className="text-sm" style={{ color: MUTED }}>Add at least one service to continue. You can add more later.</p>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: MUTED }}>Quick-add suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, name: s }))}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: MINT, border: '1px solid #e8f0e8' }}>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Service name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="col-span-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none"
            style={{ color: TEXT }}
          />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }}>
            {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }}>
            {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <input placeholder="Price (ZMW)" value={form.priceZmw}
            onChange={(e) => setForm((f) => ({ ...f, priceZmw: e.target.value }))}
            type="number" min="0"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }} />
          <input placeholder="Deposit (ZMW, optional)" value={form.depositZmw}
            onChange={(e) => setForm((f) => ({ ...f, depositZmw: e.target.value }))}
            type="number" min="0"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }} />
        </div>
        {formErr && <p className="text-xs text-red-600">{formErr}</p>}
        <button
          type="button"
          onClick={addService}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: PRIMARY }}
        >
          <Plus size={14} /> Add service
        </button>
      </div>

      {services.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: MUTED }}>Added services:</p>
          {services.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 bg-white" style={{ border: '1px solid #e8f0e8' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: TEXT }}>{s.name}</p>
                <p className="text-xs" style={{ color: MUTED }}>
                  ZMW {s.priceZmw.toFixed(0)} · {DURATIONS.find((d) => d.value === s.durationMinutes)?.label ?? `${s.durationMinutes} min`}
                </p>
              </div>
              <button type="button" onClick={() => setServices((sv) => sv.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 transition-colors ml-3">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mini hours picker ─────────────────────────────────────────────────────────
function HoursPicker({ hours, onChange }) {
  return (
    <div className="mt-3 space-y-2 pl-4 border-l-2" style={{ borderColor: MINT_CHIP }}>
      <div className="flex flex-wrap gap-1.5">
        {DAYS_SHORT.map((day, i) => {
          const on = hours.days.includes(i)
          return (
            <button key={day} type="button"
              onClick={() => onChange({ ...hours, days: on ? hours.days.filter((d) => d !== i) : [...hours.days, i] })}
              className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: on ? PRIMARY : '#f3f4f6', color: on ? '#fff' : MUTED }}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        <input type="time" value={hours.start}
          onChange={(e) => onChange({ ...hours, start: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs bg-white outline-none" />
        <span className="text-xs self-center" style={{ color: MUTED }}>to</span>
        <input type="time" value={hours.end}
          onChange={(e) => onChange({ ...hours, end: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs bg-white outline-none" />
      </div>
    </div>
  )
}

// ── Photo upload section ──────────────────────────────────────────────────────
function PhotoUploadSection({ onUpload }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function handleFile(file) {
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      onUpload(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function clear() {
    setPreview(null)
    onUpload(null)
  }

  return (
    <div className="rounded-xl p-5 space-y-3" style={{ border: '1px solid #e8f0e8' }}>
      <div>
        <p className="font-semibold text-sm" style={{ color: TEXT }}>Add a photo of your business</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          This appears on your booking page and in the directory. Customers are more likely to book when they can see your space.
        </p>
      </div>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ height: 160 }}>
          <img src={preview} alt="Business preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100 transition-colors"
          >
            <X size={14} style={{ color: TEXT }} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 transition-colors hover:border-gray-400"
          style={{ borderColor: '#d1d5db', backgroundColor: '#fafafa' }}
        >
          <Camera size={28} style={{ color: MUTED }} />
          <p className="text-sm font-medium mt-2" style={{ color: TEXT }}>Click to upload or drag and drop</p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>JPG or PNG, up to 5 MB</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={clear}
        className="text-xs hover:underline"
        style={{ color: MUTED }}
      >
        Skip for now
      </button>
    </div>
  )
}

// ── Step 3 — Team ─────────────────────────────────────────────────────────────
function TeamStep({ isSoloOperator, setIsSoloOperator, staffList, setStaffList, scheduleType, sameHours, onPhotoUpload }) {
  const defaultHours = { days: [0, 1, 2, 3, 4, 5], start: '08:00', end: '18:00' }
  const [form, setForm] = useState({ name: '', phone: '', hours: defaultHours })
  const [formErr, setFormErr] = useState('')

  function addStaff() {
    if (!form.name.trim()) { setFormErr('Name is required.'); return }
    setFormErr('')
    const username = form.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'staff'
    setStaffList((s) => [...s, { name: form.name.trim(), phone: form.phone.trim(), username, hours: form.hours }])
    setForm({ name: '', phone: '', hours: defaultHours })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: TEXT }}>Your team</h2>
        <p className="text-sm" style={{ color: MUTED }}>Tell us who's doing the work. You can add more staff later.</p>
      </div>

      {/* Business photo upload */}
      <PhotoUploadSection onUpload={onPhotoUpload} />

      {/* Solo operator toggle */}
      <button
        type="button"
        onClick={() => setIsSoloOperator((v) => !v)}
        className="w-full text-left rounded-xl p-4 border-2 transition-colors"
        style={{ borderColor: isSoloOperator ? PRIMARY : '#e5e7eb', backgroundColor: isSoloOperator ? MINT : '#fff' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: isSoloOperator ? PRIMARY : '#d1d5db', backgroundColor: isSoloOperator ? PRIMARY : 'transparent' }}
          >
            {isSoloOperator && <Check size={12} color="#fff" />}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>I work alone. I am the only staff member.</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Your schedule will be applied directly to your owner account</p>
          </div>
        </div>
      </button>

      {!isSoloOperator && (
        <>
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: MINT, border: '1px solid #e8f0e8' }}>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }} />
              <input placeholder="Phone (+260...)" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white outline-none" style={{ color: TEXT }} />
            </div>
            {scheduleType === 'individual' && (
              <HoursPicker hours={form.hours} onChange={(h) => setForm((f) => ({ ...f, hours: h }))} />
            )}
            {formErr && <p className="text-xs text-red-600">{formErr}</p>}
            <button type="button" onClick={addStaff}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY }}>
              <Plus size={14} /> Add staff member
            </button>
          </div>

          {staffList.length > 0 && (
            <div className="space-y-2">
              {staffList.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 bg-white" style={{ border: '1px solid #e8f0e8' }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: TEXT }}>{m.name}</p>
                    {m.phone && <p className="text-xs" style={{ color: MUTED }}>{m.phone}</p>}
                  </div>
                  <button type="button" onClick={() => setStaffList((s) => s.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 ml-3">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs" style={{ color: MUTED }}>
            Not ready to add staff? Skip this step. Add them later from your dashboard.
          </p>
        </>
      )}
    </div>
  )
}

// ── Shared policy UI helpers ──────────────────────────────────────────────────
function RadioOption({ label, selected, onClick, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 w-full text-left"
      >
        <div
          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
          style={{ borderColor: selected ? PRIMARY : '#d1d5db' }}
        >
          {selected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }} />}
        </div>
        <span className="text-sm" style={{ color: TEXT }}>{label}</span>
      </button>
      {selected && children}
    </div>
  )
}

function CheckOption({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-3 w-full text-left"
    >
      <div
        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: checked ? PRIMARY : '#d1d5db', backgroundColor: checked ? PRIMARY : 'transparent' }}
      >
        {checked && <Check size={10} color="#fff" />}
      </div>
      <span className="text-sm" style={{ color: TEXT }}>{label}</span>
    </button>
  )
}

function PolicySection({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold" style={{ color: TEXT }}>{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function OtherInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Describe your policy…"
      className="mt-2 ml-7 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none"
      style={{ color: TEXT }}
    />
  )
}

// ── Step 4 — AI Policies ──────────────────────────────────────────────────────
const POLICY_DEFAULTS = {
  cancellationPolicy: '',
  cancellationOther: '',
  lateArrivalPolicy: '',
  lateArrivalOther: '',
  lateFee: '',
  lateFeeAmount: '',
  lateFeeOther: '',
  waitingTime: '',
  waitingOther: '',
  whatToBring: [],
  whatToBringOther: '',
  parking: '',
  parkingOther: '',
  contactPreference: '',
  contactOther: '',
  additionalInfo: '',
}

function PoliciesStep({ policies, setPolicies }) {
  function set(key, val) {
    setPolicies((p) => ({ ...p, [key]: val }))
  }

  function toggleBring(item) {
    setPolicies((p) => ({
      ...p,
      whatToBring: p.whatToBring.includes(item)
        ? p.whatToBring.filter((i) => i !== item)
        : [...p.whatToBring, item],
    }))
  }

  const isCancOther  = policies.cancellationPolicy === 'other'
  const isLateOther  = policies.lateArrivalPolicy === 'other'
  const isFeeOther   = policies.lateFee === 'other'
  const isWaitOther  = policies.waitingTime === 'other'
  const isBringOther = policies.whatToBring.includes('other')
  const isParkOther  = policies.parking === 'other'
  const isContOther  = policies.contactPreference === 'other'

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: TEXT }}>
          Help your AI assistant
        </h2>
        <p className="text-sm" style={{ color: MUTED }}>
          These policies let your AI agent answer common customer questions accurately.
          Skip anything that doesn't apply. Update this anytime in Settings.
        </p>
      </div>

      {/* Cancellation policy */}
      <PolicySection title="Cancellation policy">
        {[
          'Free cancellation anytime',
          'Free cancellation up to 24hrs before',
          'Deposit non-refundable on cancellation',
        ].map((opt) => (
          <RadioOption
            key={opt}
            label={opt}
            selected={policies.cancellationPolicy === opt}
            onClick={() => set('cancellationPolicy', opt)}
          />
        ))}
        <RadioOption label="Other" selected={isCancOther} onClick={() => set('cancellationPolicy', 'other')}>
          <OtherInput value={policies.cancellationOther} onChange={(v) => set('cancellationOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* Late arrival */}
      <PolicySection title="Late arrival policy">
        {[
          'We allow up to 15 minutes late',
          'We allow up to 30 minutes late',
          'No late arrivals — appointment cancelled if late',
        ].map((opt) => (
          <RadioOption
            key={opt}
            label={opt}
            selected={policies.lateArrivalPolicy === opt}
            onClick={() => set('lateArrivalPolicy', opt)}
          />
        ))}
        <RadioOption label="Other" selected={isLateOther} onClick={() => set('lateArrivalPolicy', 'other')}>
          <OtherInput value={policies.lateArrivalOther} onChange={(v) => set('lateArrivalOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* Late fee */}
      <PolicySection title="Is there a late fee?">
        <RadioOption
          label="No charge — we accommodate late arrivals"
          selected={policies.lateFee === 'no_charge'}
          onClick={() => set('lateFee', 'no_charge')}
        />
        <RadioOption
          label="Yes — a late fee applies"
          selected={policies.lateFee === 'fee_applies'}
          onClick={() => set('lateFee', 'fee_applies')}
        >
          <div className="mt-2 ml-7 flex items-center gap-2">
            <span className="text-sm" style={{ color: MUTED }}>ZMW</span>
            <input
              type="number"
              min="0"
              value={policies.lateFeeAmount}
              onChange={(e) => set('lateFeeAmount', e.target.value)}
              placeholder="Amount"
              className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none"
              style={{ color: TEXT }}
            />
          </div>
        </RadioOption>
        <RadioOption
          label="Appointment cancelled and deposit forfeited"
          selected={policies.lateFee === 'deposit_forfeited'}
          onClick={() => set('lateFee', 'deposit_forfeited')}
        />
        <RadioOption label="Other" selected={isFeeOther} onClick={() => set('lateFee', 'other')}>
          <OtherInput value={policies.lateFeeOther} onChange={(v) => set('lateFeeOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* Waiting time */}
      <PolicySection title="How long should customers expect to wait if you're running behind?">
        {[
          'We run on time — no waiting',
          'Allow up to 15 minutes waiting time',
          'Allow up to 30 minutes waiting time',
        ].map((opt) => (
          <RadioOption
            key={opt}
            label={opt}
            selected={policies.waitingTime === opt}
            onClick={() => set('waitingTime', opt)}
          />
        ))}
        <RadioOption label="Other" selected={isWaitOther} onClick={() => set('waitingTime', 'other')}>
          <OtherInput value={policies.waitingOther} onChange={(v) => set('waitingOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* What to bring */}
      <PolicySection title="What should customers bring? (select all that apply)">
        {[
          'Reference photos',
          'Their own hair extensions',
          'Their own nail polish colour',
          'Nothing — we provide everything',
        ].map((opt) => (
          <CheckOption
            key={opt}
            label={opt}
            checked={policies.whatToBring.includes(opt)}
            onChange={() => toggleBring(opt)}
          />
        ))}
        <div>
          <CheckOption
            label="Other"
            checked={isBringOther}
            onChange={() => toggleBring('other')}
          />
          {isBringOther && (
            <OtherInput value={policies.whatToBringOther} onChange={(v) => set('whatToBringOther', v)} />
          )}
        </div>
      </PolicySection>

      {/* Parking */}
      <PolicySection title="Parking">
        {[
          'Free parking on site',
          'Paid parking nearby',
          'Street parking available',
          'No parking — public transport recommended',
        ].map((opt) => (
          <RadioOption
            key={opt}
            label={opt}
            selected={policies.parking === opt}
            onClick={() => set('parking', opt)}
          />
        ))}
        <RadioOption label="Other" selected={isParkOther} onClick={() => set('parking', 'other')}>
          <OtherInput value={policies.parkingOther} onChange={(v) => set('parkingOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* Contact preference */}
      <PolicySection title="How do customers prefer to contact you?">
        {[
          'Kimawa only',
          'WhatsApp also welcome',
          'Call us anytime',
        ].map((opt) => (
          <RadioOption
            key={opt}
            label={opt}
            selected={policies.contactPreference === opt}
            onClick={() => set('contactPreference', opt)}
          />
        ))}
        <RadioOption label="Other" selected={isContOther} onClick={() => set('contactPreference', 'other')}>
          <OtherInput value={policies.contactOther} onChange={(v) => set('contactOther', v)} />
        </RadioOption>
      </PolicySection>

      {/* Additional info */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: TEXT }}>
          Anything else customers should know? (optional)
        </p>
        <textarea
          value={policies.additionalInfo}
          onChange={(e) => set('additionalInfo', e.target.value)}
          placeholder="e.g. We specialise in natural African hair, by appointment only, etc."
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none resize-none"
          style={{ color: TEXT }}
        />
      </div>
    </div>
  )
}

// ── Step 5 — Ready ────────────────────────────────────────────────────────────
function ReadyStep({ subdomain, staffKey, onComplete }) {
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
  const port = window.location.port || '3000'
  // bookingOrigin: full URL with protocol — used for links and clipboard
  // bookingDisplay: human-readable without protocol — shown in the UI
  const bookingOrigin = appDomain
    ? `https://${subdomain}.${appDomain}`
    : `http://${subdomain}.localhost:${port}`
  const bookingDisplay = appDomain
    ? `${subdomain}.${appDomain}`
    : `${subdomain}.localhost:${port}`
  const ownerUrl = `${bookingOrigin}/owner`
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [going, setGoing] = useState(false)

  function copy(text, setFlag) {
    copyToClipboard(text, () => {
      setFlag(true)
      setTimeout(() => setFlag(false), 2000)
    })
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: TEXT }}>You're all set!</h2>
        <p className="text-sm" style={{ color: MUTED }}>Your Kimawa business is live. Here's everything you need.</p>
      </div>

      {/* Booking URL */}
      <div className="rounded-xl p-5 text-left" style={{ backgroundColor: MINT, border: '1px solid #d4ecd4' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PRIMARY }}>Your booking page</p>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-sm break-all" style={{ color: TEXT }}>{bookingDisplay}</p>
          <button
            onClick={() => copy(bookingOrigin, setCopiedUrl)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              backgroundColor: copiedUrl ? '#dcfce7' : MINT_CHIP,
              color: copiedUrl ? '#15803d' : PRIMARY,
            }}
          >
            {copiedUrl ? 'Copied! ✓' : 'Copy'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: MUTED }}>Share this link with your clients so they can book appointments.</p>
      </div>

      {/* Staff key */}
      {staffKey && (
        <div className="rounded-xl p-5 text-left" style={{ backgroundColor: '#fff', border: '1px solid #e8f0e8' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PRIMARY }}>Staff access key</p>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono font-bold text-lg tracking-widest" style={{ color: TEXT }}>{staffKey}</p>
            <button
              onClick={() => copy(staffKey, setCopiedKey)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: copiedKey ? '#dcfce7' : MINT_CHIP,
                color: copiedKey ? '#15803d' : PRIMARY,
              }}
            >
              {copiedKey ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Your staff enter this key at {bookingDisplay}/staff to view their schedule. Change it any time in Settings.
          </p>
        </div>
      )}

      <button
        onClick={async () => {
          setGoing(true)
          try { await onComplete() } catch { /* non-blocking */ }
          const t = getToken()
          const r = getRefreshToken()
          const dest = new URL(ownerUrl)
          if (t) dest.searchParams.set('t', t)
          if (r) dest.searchParams.set('r', r)
          window.location.href = dest.toString()
        }}
        disabled={going}
        className="block w-full py-4 rounded-xl font-semibold text-white text-center transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: PRIMARY }}
      >
        {going ? 'Taking you there…' : 'Go to my dashboard →'}
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { login, isAuthenticated, isOwner } = useAuth()
  const navigate = useNavigate()

  const [slug] = useState(() => new URLSearchParams(window.location.search).get('slug') || '')
  const tenantClient = useMemo(() => {
    if (!slug) return undefined
    const apiDomain = import.meta.env.VITE_TENANT_API_DOMAIN
    const uri = apiDomain
      ? `https://${slug}.${apiDomain}/graphql/`
      : `http://${slug}.localhost:8000/graphql/`
    const authLink = setContext((_, { headers }) => {
      const token = getToken()
      return { headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
    })
    return new ApolloClient({
      link: ApolloLink.from([authLink, createHttpLink({ uri })]),
      cache: new InMemoryCache(),
    })
  }, [slug])

  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [businessType, setBusinessType] = useState('salon')
  const [staffKey, setStaffKey] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t  = params.get('t')
    const r  = params.get('r')
    const bt = params.get('bt')
    const sk = params.get('sk')

    if (t && r) {
      setTokens(t, r)
      saveRole('owner')
      login(t, r, { role: 'owner' })
      window.history.replaceState({}, '', '/onboarding')
    }
    if (bt) setBusinessType(bt)
    if (sk) setStaffKey(sk)

    setTokenLoaded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: settingsData } = useQuery(SALON_SETTINGS, { skip: !tokenLoaded || !!staffKey || !tenantClient, client: tenantClient })
  useEffect(() => {
    if (settingsData?.salonSettings?.staffAccessKey) {
      setStaffKey(settingsData.salonSettings.staffAccessKey)
    }
  }, [settingsData])

  const [step, setStep] = useState(1)
  const [scheduleType, setScheduleType] = useState('same')
  const [sameHours,    setSameHours]    = useState({ days: [0, 1, 2, 3, 4, 5], start: '08:00', end: '18:00' })
  const [services,     setServices]     = useState([])
  const [isSoloOperator,  setIsSoloOperator] = useState(false)
  const [staffList,    setStaffList]    = useState([])
  const [policies,     setPolicies]     = useState(POLICY_DEFAULTS)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const step2Done = useRef(false)
  const step3Done = useRef(false)
  const step4Done = useRef(false)

  const [createService]      = useMutation(CREATE_SERVICE,           { client: tenantClient })
  const [createStaff]        = useMutation(CREATE_STAFF,             { client: tenantClient })
  const [setWorkingHours]    = useMutation(SET_WORKING_HOURS,        { client: tenantClient })
  const [updateProfile]      = useMutation(UPDATE_TENANT_PROFILE,    { client: tenantClient })
  const [updatePolicies]     = useMutation(UPDATE_BUSINESS_POLICIES, { client: tenantClient })
  const [completeOnboarding] = useMutation(COMPLETE_ONBOARDING,      { client: tenantClient })

  async function handlePhotoUpload(dataUrl) {
    if (dataUrl) {
      try {
        await updateProfile({ variables: { coverImageUrl: dataUrl } })
      } catch {
        // Non-blocking — photo failure shouldn't stop onboarding
      }
    }
  }

  async function applyHours(staffId, hours) {
    for (let day = 0; day < 7; day++) {
      const isDayOff = !hours.days.includes(day)
      await setWorkingHours({
        variables: { staffId, dayOfWeek: day, isDayOff, startTime: isDayOff ? null : hours.start, endTime: isDayOff ? null : hours.end },
      })
    }
  }

  async function handleNext() {
    setError('')

    if (step === 2 && !step2Done.current) {
      if (services.length === 0) { setError('Add at least one service to continue.'); return }
      setSaving(true)
      try {
        for (const svc of services) await createService({ variables: svc })
        step2Done.current = true
      } catch (e) {
        setError(e?.graphQLErrors?.[0]?.message || e.message)
        setSaving(false)
        return
      }
      setSaving(false)
    }

    if (step === 3 && !step3Done.current) {
      setSaving(true)
      try {
        if (isSoloOperator) {
          const { data } = await createStaff({ variables: { isMe: true } })
          if (scheduleType === 'same') await applyHours(data.createStaff.id, sameHours)
        } else {
          for (const m of staffList) {
            const { data } = await createStaff({ variables: { fullName: m.name, phone: m.phone, username: m.username } })
            await applyHours(data.createStaff.id, scheduleType === 'same' ? sameHours : m.hours)
          }
        }
        step3Done.current = true
      } catch (e) {
        setError(e?.graphQLErrors?.[0]?.message || e.message)
        setSaving(false)
        return
      }
      setSaving(false)
    }

    if (step === 4 && !step4Done.current) {
      setSaving(true)
      try {
        const lateFeeText =
          policies.lateFee === 'fee_applies' && policies.lateFeeAmount
            ? `Late fee applies: ZMW ${policies.lateFeeAmount}`
            : policies.lateFee === 'other'
            ? policies.lateFeeOther
            : policies.lateFee === 'no_charge'
            ? 'No charge — we accommodate late arrivals'
            : policies.lateFee === 'deposit_forfeited'
            ? 'Appointment cancelled and deposit forfeited'
            : policies.lateFee

        const whatToBring = [
          ...policies.whatToBring.filter((i) => i !== 'other'),
          ...(policies.whatToBring.includes('other') && policies.whatToBringOther
            ? [policies.whatToBringOther]
            : []),
        ]

        await updatePolicies({
          variables: {
            policies: {
              cancellationPolicy: policies.cancellationPolicy === 'other'
                ? policies.cancellationOther
                : policies.cancellationPolicy,
              lateArrivalPolicy: policies.lateArrivalPolicy === 'other'
                ? policies.lateArrivalOther
                : policies.lateArrivalPolicy,
              lateFee: lateFeeText,
              waitingTime: policies.waitingTime === 'other'
                ? policies.waitingOther
                : policies.waitingTime,
              whatToBring,
              parking: policies.parking === 'other' ? policies.parkingOther : policies.parking,
              contactPreference: policies.contactPreference === 'other'
                ? policies.contactOther
                : policies.contactPreference,
              additionalInfo: policies.additionalInfo,
            },
          },
        })
        step4Done.current = true
      } catch (e) {
        setError(e?.graphQLErrors?.[0]?.message || e.message)
        setSaving(false)
        return
      }
      setSaving(false)
    }

    setStep((s) => Math.min(s + 1, 5))
  }

  async function handleComplete() {
    try { await completeOnboarding() } catch { /* non-blocking */ }
  }

  if (!tokenLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: MINT }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY }} />
      </div>
    )
  }

  if (!isAuthenticated || !isOwner) {
    navigate('/login', { replace: true })
    return null
  }

  if (!slug) {
    navigate('/signup', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: MINT, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <header className="bg-white border-b" style={{ borderColor: '#e8f0e8' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold" style={{ color: PRIMARY }}>Kimawa</span>
          <span className="text-sm" style={{ color: MUTED }}>
            Step {Math.min(step, STEP_LABELS.length)} of {STEP_LABELS.length}: {STEP_LABELS[step - 1] ?? STEP_LABELS[STEP_LABELS.length - 1]}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <ProgressBar step={step} />

        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #e8f0e8' }}>
          {step === 1 && (
            <ScheduleStep scheduleType={scheduleType} setScheduleType={setScheduleType}
              sameHours={sameHours} setSameHours={setSameHours} />
          )}
          {step === 2 && (
            <ServicesStep businessType={businessType} services={services} setServices={setServices} />
          )}
          {step === 3 && (
            <TeamStep
              isSoloOperator={isSoloOperator} setIsSoloOperator={setIsSoloOperator}
              staffList={staffList} setStaffList={setStaffList}
              scheduleType={scheduleType} sameHours={sameHours}
              onPhotoUpload={handlePhotoUpload}
            />
          )}
          {step === 4 && <PoliciesStep policies={policies} setPolicies={setPolicies} />}
          {step === 5 && <ReadyStep subdomain={slug} staffKey={staffKey} onComplete={handleComplete} />}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step < 5 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: '#e8f0e8' }}>
              <button
                onClick={() => setStep((s) => Math.max(s - 1, 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-30"
                style={{ color: MUTED }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                {saving ? 'Saving…' : step === 4 ? 'Finish setup' : 'Next'}
                {!saving && <ChevronRight size={16} />}
              </button>
            </div>
          )}
        </div>

        {(step === 1 || step === 3 || step === 4) && (
          <p className="text-center mt-4 text-sm" style={{ color: MUTED }}>
            <button onClick={() => setStep((s) => Math.min(s + 1, 5))} className="hover:underline" style={{ color: MUTED }}>
              Skip this step. Set it up later.
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
