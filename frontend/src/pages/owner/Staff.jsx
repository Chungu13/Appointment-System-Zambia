import { useState, useRef } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react'
import { ChevronLeft, ChevronRight, Check, Camera, Eye, EyeOff } from 'lucide-react'
import { STAFF_LIST, MY_PROFILE, STAFF_DAY_SLOTS } from '../../graphql/queries/staff'
import { SERVICES } from '../../graphql/queries/services'
import {
  CREATE_STAFF,
  SET_WORKING_HOURS,
  ASSIGN_SERVICE,
  REMOVE_SERVICE,
  UPDATE_STAFF_PROFILE,
} from '../../graphql/mutations/staff'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatZMW } from '../../lib/utils'

const BURG     = '#3B2A1E'
const TEXT     = '#241812'
const MUTED    = '#5C4C3D'
const HINT     = '#8A7A6A'
const BORDER   = '#EDE3D6'
const BLUSH    = '#FBF7F1'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function initials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Default available times: 30-min intervals from 9:00 to 18:00
function generateDefaultTimes() {
  const times = []
  for (let h = 9; h < 18; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    times.push(`${String(h).padStart(2, '0')}:30`)
  }
  times.push('18:00')
  return times
}

const DEFAULT_HOURS = DAYS.map((_, day) => ({
  dayOfWeek: day,
  isDayOff: day === 6, // Sunday off by default
  availableTimes: day === 6 ? [] : generateDefaultTimes(),
}))

function hoursMapFor(member, allMembers) {
  const own = member.workingHours ?? []
  if (own.length > 0) {
    const byDay = Object.fromEntries(own.map((wh) => [wh.dayOfWeek, wh]))
    return DAYS.map((_, day) => {
      const wh = byDay[day]
      return wh
        ? { dayOfWeek: day, isDayOff: wh.isDayOff, availableTimes: wh.availableTimes || [] }
        : { dayOfWeek: day, isDayOff: true, availableTimes: [] }
    })
  }
  const donor = (allMembers ?? []).find((m) => m.id !== member.id && (m.workingHours ?? []).length > 0)
  if (donor) {
    const byDay = Object.fromEntries(donor.workingHours.map((wh) => [wh.dayOfWeek, wh]))
    return DAYS.map((_, day) => {
      const wh = byDay[day]
      return wh
        ? { dayOfWeek: day, isDayOff: wh.isDayOff, availableTimes: wh.availableTimes || [] }
        : { dayOfWeek: day, isDayOff: true, availableTimes: [] }
    })
  }
  return DEFAULT_HOURS
}

// ── Create staff modal ────────────────────────────────────────────────────────
function CreateStaffModal({ onClose, onCreated }) {
  const { profile } = useAuth()
  const [isMe, setIsMe] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', username: '', email: '' })

  const [createStaff, { loading, error }] = useMutation(CREATE_STAFF, {
    refetchQueries: [STAFF_LIST, MY_PROFILE],
    onCompleted: () => { onCreated(); onClose() },
  })

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function toggleIsMe(checked) {
    setIsMe(checked)
    if (checked && profile) {
      setForm((f) => ({
        ...f,
        fullName: profile.fullName ?? '',
        phone: profile.phone ?? '',
        username: profile.username ?? '',
        email: profile.email ?? '',
      }))
    }
  }

  function submit(e) {
    e.preventDefault()
    if (isMe) {
      createStaff({ variables: { isMe: true } })
    } else {
      createStaff({ variables: { ...form, isMe: false } })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
          <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: TEXT, margin: 0 }}>Add staff member</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Error'} />}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: `0.5px solid ${BORDER}`, backgroundColor: BLUSH, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isMe}
              onChange={(e) => toggleIsMe(e.target.checked)}
              style={{ marginTop: 2, accentColor: BURG }}
            />
            <div>
              <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: TEXT, margin: '0 0 2px' }}>This is me (I also do the work)</p>
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                Tick this if you're the sole operator. Your appointments will show on the dashboard.
              </p>
            </div>
          </label>

          {isMe ? (
            <div style={{ border: `0.5px solid ${BORDER}`, padding: 12, fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED }}>
              <p style={{ fontWeight: 400, color: TEXT, margin: '0 0 2px' }}>{profile?.fullName}</p>
              <p style={{ margin: 0 }}>{profile?.phone}</p>
            </div>
          ) : (
            <>
              <Input label="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
              <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+260 97..." required />
              <Input label="Username (for records)" value={form.username} onChange={(e) => set('username', e.target.value)} required />
              <Input label="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!isMe && (!form.fullName || !form.phone || !form.username)}
              className="flex-1"
            >
              {isMe ? 'Link my account' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── List view — compact rows, tap to open detail ──────────────────────────────
function StaffListRow({ member, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const isOwner = member.role === 'OWNER'

  return (
    <button
      onClick={() => onSelect(member.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', backgroundColor: hovered ? BLUSH : '#fff',
        border: `0.5px solid ${BORDER}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        transition: 'background-color 0.1s',
      }}
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.fullName} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, backgroundColor: isOwner ? BURG : '#EDD5D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: isOwner ? '#fff' : BURG }}>{initials(member.fullName)}</span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>{member.fullName}</p>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0 }}>{member.phone}</p>
      </div>

      <span style={{
        fontFamily: sans, fontSize: 11, fontWeight: 500,
        padding: '4px 12px', flexShrink: 0, borderRadius: 20,
        backgroundColor: isOwner ? '#f5e6c8' : BLUSH,
        color: isOwner ? '#8a6a1a' : BURG,
      }}>
        {isOwner ? 'Owner' : 'Staff'}
      </span>

      <ChevronRight size={16} color={HINT} style={{ flexShrink: 0 }} />
    </button>
  )
}

// ── Detail — Profile tab ──────────────────────────────────────────────────────
function ProfileTab({ member }) {
  const [avatarPreview, setAvatarPreview] = useState(member.avatarUrl || null)
  const [bio, setBio] = useState(member.bio || '')
  const [isPublic, setIsPublic] = useState(member.displayOnPublicPage ?? false)
  const [saved, setSaved] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const [updateProfile, { loading }] = useMutation(UPDATE_STAFF_PROFILE, {
    refetchQueries: [STAFF_LIST],
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 2500) },
  })

  function processFile(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return
    if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function save() {
    updateProfile({ variables: { staffId: member.id, bio, displayOnPublicPage: isPublic, avatarUrl: avatarPreview } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {avatarPreview ? (
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <img src={avatarPreview} alt="Avatar" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', backgroundColor: BURG, color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Camera size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]) }}
              style={{ width: 72, height: 72, borderRadius: 12, border: `0.5px solid ${dragOver ? BURG : BORDER}`, backgroundColor: dragOver ? BLUSH : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.1s' }}
            >
              <Camera size={16} color={MUTED} />
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED }}>Photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: 6 }}>Short bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="e.g. 5 years experience in braiding and natural hair"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT, backgroundColor: '#fff', resize: 'none', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>
      </div>

      <button
        onClick={() => setIsPublic((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, fontSize: 12, fontWeight: 400, padding: '10px 14px', border: `0.5px solid ${isPublic ? '#d4a8b0' : BORDER}`, borderRadius: 8, backgroundColor: isPublic ? BLUSH : '#fff', color: isPublic ? BURG : MUTED, cursor: 'pointer', transition: 'all 0.1s', alignSelf: 'flex-start' }}
      >
        {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
        {isPublic ? 'Shown on public page' : 'Hidden from public page'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={loading}
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '12px 28px', borderRadius: 10, backgroundColor: BURG, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Saving…' : 'Save profile'}
        </button>
        {saved && <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#16a34a' }}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Detail — Hours tab ────────────────────────────────────────────────────────
function HoursTab({ member, allMembers }) {
  const [hours, setHours] = useState(() => hoursMapFor(member, allMembers))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const client = useApolloClient()
  const [setWorkingHours] = useMutation(SET_WORKING_HOURS)

  function updateDay(day, patch) {
    setHours((prev) => prev.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)))
  }

  function toggleTime(dayOfWeek, time) {
    updateDay(dayOfWeek, {
      availableTimes: hours[dayOfWeek].availableTimes.includes(time)
        ? hours[dayOfWeek].availableTimes.filter((t) => t !== time)
        : [...hours[dayOfWeek].availableTimes, time].sort(),
    })
  }

  function addCustomTime(dayOfWeek, timeStr) {
    const times = hours[dayOfWeek].availableTimes
    if (!times.includes(timeStr)) {
      updateDay(dayOfWeek, { availableTimes: [...times, timeStr].sort() })
    }
  }

  function removeTime(dayOfWeek, time) {
    updateDay(dayOfWeek, {
      availableTimes: hours[dayOfWeek].availableTimes.filter((t) => t !== time),
    })
  }

  function copyToAllDays(dayOfWeek) {
    const source = hours[dayOfWeek].availableTimes
    setHours((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? d : { ...d, availableTimes: source }))
    )
  }

  async function saveAll() {
    setSaving(true)
    try {
      await Promise.all(
        hours.map((d) =>
          setWorkingHours({
            variables: {
              staffId: member.id,
              dayOfWeek: d.dayOfWeek,
              isDayOff: d.isDayOff,
              availableTimes: d.isDayOff ? [] : d.availableTimes,
            },
          }),
        ),
      )
      // Refetch availability for the next 7 days to reflect new times
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().slice(0, 10)
        client.refetchQueries({
          include: [STAFF_DAY_SLOTS],
          variables: { staffId: member.id, date: dateStr },
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // Generate 30-min pills from 06:00 to 22:00
  const allCandidateTimes = []
  for (let h = 6; h < 22; h++) {
    allCandidateTimes.push(`${String(h).padStart(2, '0')}:00`)
    allCandidateTimes.push(`${String(h).padStart(2, '0')}:30`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hours.map((d) => {
          const customTimes = d.availableTimes.filter((t) => !allCandidateTimes.includes(t))
          return (
            <div key={d.dayOfWeek} style={{ border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: d.isDayOff ? HINT : TEXT }}>{DAYS[d.dayOfWeek]}</span>
                <button
                  type="button"
                  onClick={() => updateDay(d.dayOfWeek, { isDayOff: !d.isDayOff })}
                  style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: d.isDayOff ? BORDER : BURG, transition: 'background-color 0.15s', padding: 0, position: 'relative' }}
                >
                  <span style={{ position: 'absolute', top: 2, left: d.isDayOff ? 2 : 18, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.15s' }} />
                </button>
              </div>

              {d.isDayOff ? (
                <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, margin: 0 }}>Day off</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Pill grid for 30-min intervals */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allCandidateTimes.map((time) => {
                      const selected = d.availableTimes.includes(time)
                      return (
                        <button
                          key={time}
                          onClick={() => toggleTime(d.dayOfWeek, time)}
                          style={{
                            fontFamily: sans,
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `0.5px solid ${selected ? BURG : BORDER}`,
                            backgroundColor: selected ? BURG : '#fff',
                            color: selected ? '#fff' : TEXT,
                            cursor: 'pointer',
                            transition: 'all 0.1s',
                          }}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom time input */}
                  <CustomTimeAdder
                    dayOfWeek={d.dayOfWeek}
                    existingTimes={d.availableTimes}
                    onAdd={(time) => addCustomTime(d.dayOfWeek, time)}
                    onRemove={(time) => removeTime(d.dayOfWeek, time)}
                    sans={sans}
                    TEXT={TEXT}
                    BORDER={BORDER}
                    BURG={BURG}
                    MUTED={MUTED}
                    HINT={HINT}
                  />

                  {/* Copy to all days button */}
                  {d.availableTimes.length > 0 && (
                    <button
                      onClick={() => copyToAllDays(d.dayOfWeek)}
                      style={{
                        fontFamily: sans,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: `0.5px solid ${BORDER}`,
                        backgroundColor: '#fff',
                        color: MUTED,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Same for all days
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={saveAll}
          disabled={saving}
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '12px 28px', borderRadius: 10, backgroundColor: BURG, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save working hours'}
        </button>
        {saved && <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#16a34a' }}>Saved ✓</span>}
      </div>
    </div>
  )
}

// Custom time input component
function CustomTimeAdder({ dayOfWeek, existingTimes, onAdd, onRemove, sans, TEXT, BORDER, BURG, MUTED, HINT }) {
  const [customTime, setCustomTime] = useState('')
  const customTimes = existingTimes.filter(
    (t) => !/^(0[6-9]|1\d|2[0-1]):(00|30)$/.test(t)
  )

  function handleAdd(e) {
    e.preventDefault()
    if (customTime && !existingTimes.includes(customTime)) {
      onAdd(customTime)
      setCustomTime('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <input
          type="time"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          style={{
            flex: 1,
            border: `0.5px solid ${BORDER}`,
            borderRadius: 6,
            padding: '6px 8px',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 300,
            color: TEXT,
            backgroundColor: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!customTime || existingTimes.includes(customTime)}
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: BURG,
            color: '#fff',
            cursor: 'pointer',
            opacity: !customTime || existingTimes.includes(customTime) ? 0.5 : 1,
          }}
        >
          Add
        </button>
      </div>

      {customTimes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {customTimes.map((time) => (
            <div
              key={time}
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: 4,
                border: `0.5px solid #d4a8b0`,
                backgroundColor: BLUSH,
                color: BURG,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {time}
              <button
                onClick={() => onRemove(time)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: BURG,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail — Services tab ─────────────────────────────────────────────────────
function ServicesTab({ member, allServices }) {
  const [assigned, setAssigned] = useState(() => new Set(member.assignedServiceIds ?? []))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assign] = useMutation(ASSIGN_SERVICE)
  const [remove] = useMutation(REMOVE_SERVICE)

  function toggle(serviceId) {
    setAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) next.delete(serviceId)
      else next.add(serviceId)
      return next
    })
  }

  async function save() {
    setSaving(true)
    const original = new Set(member.assignedServiceIds ?? [])
    const toAssign = [...assigned].filter((id) => !original.has(id))
    const toRemove = [...original].filter((id) => !assigned.has(id))
    try {
      await Promise.all([
        ...toAssign.map((serviceId) => assign({ variables: { staffId: member.id, serviceId } })),
        ...toRemove.map((serviceId) => remove({ variables: { staffId: member.id, serviceId } })),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '0 0 12px' }}>
          Services {member.fullName?.split(' ')[0]} can perform
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allServices.map((s) => {
            const on = assigned.has(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', fontFamily: sans, textAlign: 'left',
                  border: `0.5px solid ${BORDER}`, borderRadius: 10,
                  backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.1s',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${on ? BURG : BORDER}`,
                  backgroundColor: on ? BURG : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Check size={14} color="#fff" strokeWidth={3} />}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 400, color: TEXT }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 300, color: MUTED, flexShrink: 0 }}>From {formatZMW(s.priceZmw)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '12px 28px', borderRadius: 10, backgroundColor: BURG, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save services'}
        </button>
        {saved && <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#16a34a' }}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Detail — Available Times tab ──────────────────────────────────────────────
function dateStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function AvailableTimesTab({ member }) {
  const today = dateStr(0)
  const tomorrow = dateStr(1)
  const [date, setDate] = useState(today)

  const { data, loading, error } = useQuery(STAFF_DAY_SLOTS, {
    variables: { staffId: member.id, date },
    fetchPolicy: 'network-only',
  })

  const slots = data?.staffDaySlots ?? []
  const firstName = member.fullName?.split(' ')[0] ?? 'This staff member'

  function quickPillStyle(active) {
    return {
      fontFamily: sans, fontSize: 12, fontWeight: 500, padding: '8px 16px',
      borderRadius: 10, cursor: 'pointer',
      border: active ? 'none' : `0.5px solid ${BORDER}`,
      backgroundColor: active ? BURG : '#fff',
      color: active ? '#fff' : MUTED,
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setDate(today)} style={quickPillStyle(date === today)}>Today</button>
        <button onClick={() => setDate(tomorrow)} style={quickPillStyle(date === tomorrow)}>Tomorrow</button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT, backgroundColor: '#fff', outline: 'none' }}
        />
      </div>

      {loading && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0 }}>Loading…</p>}
      {error && <ErrorMessage message={error.message} />}

      {!loading && !error && slots.length === 0 && (
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, margin: 0 }}>
          {firstName} isn't scheduled to work this day, so there are no slots to show.
        </p>
      )}

      {slots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 8 }}>
          {slots.map((s) => (
            <div
              key={s.startsAt}
              title={s.isBooked ? 'Booked' : 'Available'}
              style={{
                textAlign: 'center', padding: '9px 6px', borderRadius: 8,
                fontFamily: sans, fontSize: 12, fontWeight: 500,
                border: `0.5px solid ${s.isBooked ? BORDER : '#d4a8b0'}`,
                backgroundColor: s.isBooked ? '#f2eeee' : BLUSH,
                color: s.isBooked ? HINT : BURG,
                textDecoration: s.isBooked ? 'line-through' : 'none',
              }}
            >
              {formatSlotTime(s.startsAt)}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: 0 }}>
        Updates automatically as bookings come in — based on {firstName}'s hours and the salon's slot interval.
      </p>
    </div>
  )
}

// ── Detail view ────────────────────────────────────────────────────────────────
function StaffDetail({ member, allMembers, allServices, onBack }) {
  const [tab, setTab] = useState('profile')
  const isOwner = member.role === 'OWNER'

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'hours', label: 'Hours' },
    { key: 'services', label: 'Services' },
    { key: 'times', label: 'Available Times' },
  ]

  return (
    <div>
      <div style={{ backgroundColor: BURG, borderRadius: 16, padding: '20px 20px 0', marginBottom: 0 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontFamily: sans, fontSize: 12, fontWeight: 400, padding: 0, marginBottom: 16 }}
        >
          <ChevronLeft size={16} /> Back to staff
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.fullName} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 500, color: '#fff' }}>{initials(member.fullName)}</span>
            </div>
          )}
          <div>
            <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: '#fff', margin: '0 0 3px' }}>{member.fullName}</p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              {member.phone} &middot; {isOwner ? 'Owner' : 'Staff'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
          {tabs.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: sans, fontSize: 13, fontWeight: 500, padding: '9px 20px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.14)',
                  color: active ? BURG : '#fff',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ backgroundColor: BLUSH, borderRadius: '0 0 16px 16px', padding: 20 }}>
        {tab === 'profile' && <ProfileTab member={member} />}
        {tab === 'hours' && <HoursTab member={member} allMembers={allMembers} />}
        {tab === 'services' && <ServicesTab member={member} allServices={allServices} />}
        {tab === 'times' && <AvailableTimesTab member={member} />}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Staff() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const { data: staffData, loading: staffLoading, error: staffError } = useQuery(STAFF_LIST, {
    fetchPolicy: 'cache-and-network',
  })
  const { data: serviceData } = useQuery(SERVICES, { variables: { activeOnly: true } })

  const members = staffData?.staffList ?? []
  const services = serviceData?.services ?? []
  const selected = members.find((m) => m.id === selectedId)

  if (selected) {
    return (
      <PageWrapper>
        <StaffDetail
          member={selected}
          allMembers={members}
          allServices={services}
          onBack={() => setSelectedId(null)}
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Staff"
        subtitle="Manage your team, hours, and services"
        action={
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: BURG, color: '#fff', padding: '10px 20px',
              fontFamily: sans, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.02em', borderRadius: 10,
              border: 'none', cursor: 'pointer',
            }}
          >
            + Add Staff
          </button>
        }
      />

      {staffLoading && <PageSpinner />}
      {staffError && <ErrorMessage message={staffError.message} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((member) => (
          <StaffListRow key={member.id} member={member} onSelect={setSelectedId} />
        ))}
      </div>

      {members.length > 0 && (
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, letterSpacing: '0.06em', textTransform: 'uppercase', color: HINT, textAlign: 'center', margin: '16px 0 0' }}>
          Tap a person to edit →
        </p>
      )}

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
        />
      )}
    </PageWrapper>
  )
}
