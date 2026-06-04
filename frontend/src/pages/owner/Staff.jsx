import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { ChevronDown, ChevronUp, Plus, KeyRound, X, Camera, Eye, EyeOff } from 'lucide-react'
import { STAFF_LIST, MY_PROFILE } from '../../graphql/queries/staff'
import { SERVICES } from '../../graphql/queries/services'
import {
  CREATE_STAFF,
  SET_STAFF_PIN,
  SET_WORKING_HOURS,
  ASSIGN_SERVICE,
  REMOVE_SERVICE,
  UPDATE_STAFF_PROFILE,
} from '../../graphql/mutations/staff'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'

const PRIMARY = '#6B2737'
const MUTED   = '#6B4A50'
const BORDER  = '#E8D8DC'
const NEAR_BLACK = '#1A0A0D'
const serif = "'Cormorant Garamond', Georgia, serif"

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ── Create staff modal ────────────────────────────────────────────────────────
function CreateStaffModal({ onClose, onCreated }) {
  const { profile } = useAuth()
  const [isMe, setIsMe] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', username: '', email: '', pin: '' })

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
      createStaff({ variables: { isMe: true, pin: form.pin || null } })
    } else {
      createStaff({ variables: { ...form, pin: form.pin || null, isMe: false } })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: NEAR_BLACK, margin: 0 }}>Add staff member</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Error'} />}

          {/* "This is me" toggle */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: '#FDF0F2', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isMe}
              onChange={(e) => toggleIsMe(e.target.checked)}
              style={{ marginTop: 2, accentColor: PRIMARY }}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: NEAR_BLACK, margin: '0 0 2px' }}>This is me (I also do the work)</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                Tick this if you're the sole operator. Your appointments will show on the dashboard.
              </p>
            </div>
          </label>

          {isMe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ borderRadius: 10, border: `1px solid ${BORDER}`, padding: 12, fontSize: 13, color: MUTED }}>
                <p style={{ fontWeight: 600, color: NEAR_BLACK, margin: '0 0 2px' }}>{profile?.fullName}</p>
                <p style={{ margin: 0 }}>{profile?.phone}</p>
              </div>
              <Input
                label="Your PIN (4 digits, for quick sign-in)"
                value={form.pin}
                onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                placeholder="e.g. 1234"
                hint="You'll use your phone number + this PIN to access the staff view"
              />
            </div>
          ) : (
            <>
              <Input label="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
              <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+260 97..." required />
              <Input label="Username (for records)" value={form.username} onChange={(e) => set('username', e.target.value)} required />
              <Input label="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <Input label="PIN (4 digits, optional)" value={form.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} placeholder="e.g. 1234" />
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

// ── Working hours row ─────────────────────────────────────────────────────────
function HoursRow({ staffId, day, wh }) {
  // wh may be undefined if not set yet
  const existing = wh ?? { isDayOff: false, startTime: '', endTime: '' }
  const [isDayOff, setIsDayOff] = useState(existing.isDayOff)
  const [start, setStart] = useState(existing.startTime ?? '')
  const [end, setEnd] = useState(existing.endTime ?? '')
  const [saved, setSaved] = useState(false)

  const [setHours, { loading }] = useMutation(SET_WORKING_HOURS, {
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
  })

  // Ensure HH:MM:SS format — time inputs return "HH:MM", Strawberry needs seconds
  function toTimeStr(val) {
    if (!val) return null
    const p = val.split(':')
    return `${p[0].padStart(2,'0')}:${(p[1]||'00').padStart(2,'0')}:${(p[2]||'00').padStart(2,'0')}`
  }

  function save() {
    setHours({
      variables: {
        staffId,
        dayOfWeek: day,
        isDayOff,
        startTime: isDayOff ? null : toTimeStr(start),
        endTime: isDayOff ? null : toTimeStr(end),
      },
    })
  }

  const timeInput = { border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 8px', fontSize: 13, color: NEAR_BLACK, backgroundColor: '#fff', outline: 'none', width: 112 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}44` }} className="last:border-b-0">
      <span style={{ width: 88, fontSize: 13, fontWeight: 500, color: NEAR_BLACK, flexShrink: 0 }}>{DAYS[day]}</span>

      {/* Day off toggle */}
      <button
        type="button"
        onClick={() => setIsDayOff((v) => !v)}
        style={{ width: 32, height: 18, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: isDayOff ? '#C8A8B0' : PRIMARY, transition: 'background-color 0.15s', padding: 0, position: 'relative' }}
      >
        <span style={{ position: 'absolute', top: 3, left: isDayOff ? 3 : 13, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s' }} />
      </button>
      <span style={{ fontSize: 11, color: MUTED, width: 44, flexShrink: 0 }}>{isDayOff ? 'Day off' : 'Open'}</span>

      {!isDayOff && (
        <>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={timeInput} />
          <span style={{ fontSize: 12, color: MUTED }}>–</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={timeInput} />
        </>
      )}

      <div style={{ marginLeft: 'auto' }}>
        {saved ? (
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Saved ✓</span>
        ) : (
          <Button size="sm" variant="ghost" loading={loading} onClick={save}>Save</Button>
        )}
      </div>
    </div>
  )
}

// ── Service assignment ────────────────────────────────────────────────────────
function ServiceAssignment({ staffId, assignedIds, services }) {
  const refetchList = { refetchQueries: [STAFF_LIST] }
  const [assign] = useMutation(ASSIGN_SERVICE, refetchList)
  const [remove] = useMutation(REMOVE_SERVICE, refetchList)

  function toggle(serviceId) {
    const isAssigned = assignedIds.includes(serviceId)
    if (isAssigned) remove({ variables: { staffId, serviceId } })
    else assign({ variables: { staffId, serviceId } })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {services.map((s) => {
        const on = assignedIds.includes(s.id)
        return (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 10, padding: '8px 12px', fontSize: 13, textAlign: 'left',
              border: `1px solid ${on ? PRIMARY : BORDER}`,
              backgroundColor: on ? '#FDF0F2' : '#fff',
              color: on ? PRIMARY : MUTED,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: on ? PRIMARY : BORDER }} />
            {s.name}
          </button>
        )
      })}
    </div>
  )
}

// ── PIN setter ────────────────────────────────────────────────────────────────
function PinSetter({ staffId }) {
  const [pin, setPin] = useState('')
  const [done, setDone] = useState(false)
  const [setStaffPin, { loading, error }] = useMutation(SET_STAFF_PIN, {
    onCompleted: () => { setDone(true); setPin(''); setTimeout(() => setDone(false), 3000) },
  })

  return (
    <div className="flex items-end gap-3">
      <Input
        label="Staff PIN (4 digits)"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="1234"
        className="w-36"
        hint="Staff uses phone + PIN to sign in"
      />
      <Button
        size="sm"
        variant="outline"
        loading={loading}
        disabled={pin.length !== 4}
        onClick={() => setStaffPin({ variables: { staffId, pin } })}
        className="mb-px"
      >
        <KeyRound size={14} /> Set PIN
      </Button>
      {done && <span className="text-sm text-green-700 font-medium mb-1">PIN updated ✓</span>}
      {error && <span className="text-sm text-red-600 mb-1">{error.graphQLErrors?.[0]?.message}</span>}
    </div>
  )
}

// ── Public profile editor (photo + bio + visibility) ─────────────────────────
function StaffProfileEditor({ member }) {
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
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
      updateProfile({ variables: { staffId: member.id, avatarUrl: e.target.result } })
    }
    reader.readAsDataURL(file)
  }

  function save() {
    updateProfile({ variables: { staffId: member.id, bio, displayOnPublicPage: isPublic } })
  }

  function togglePublic() {
    const next = !isPublic
    setIsPublic(next)
    updateProfile({ variables: { staffId: member.id, displayOnPublicPage: next } })
  }

  return (
    <div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: NEAR_BLACK, marginBottom: 12, marginTop: 0 }}>Public profile</h3>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Avatar upload */}
        <div style={{ flexShrink: 0 }}>
          {avatarPreview ? (
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <img src={avatarPreview} alt="Avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BORDER}` }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', backgroundColor: PRIMARY, color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Camera size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]) }}
              style={{ width: 72, height: 72, borderRadius: '50%', border: `2px dashed ${dragOver ? PRIMARY : BORDER}`, backgroundColor: dragOver ? '#FDF0F2' : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.12s' }}
            >
              <Camera size={16} color={MUTED} />
              <span style={{ fontSize: 11, color: MUTED }}>Photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
        </div>

        {/* Bio + visibility */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 4 }}>Short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="e.g. 5 years experience in braiding and natural hair"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13, color: NEAR_BLACK, backgroundColor: '#fff', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={togglePublic}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: `1px solid ${isPublic ? PRIMARY : BORDER}`, backgroundColor: isPublic ? '#FDF0F2' : '#fff', color: isPublic ? PRIMARY : MUTED, cursor: 'pointer', transition: 'all 0.12s' }}
            >
              {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
              {isPublic ? 'Shown on public page' : 'Hidden from public page'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saved && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Saved ✓</span>}
              <button
                onClick={save}
                disabled={loading}
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 8, backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Saving…' : 'Save bio'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Staff member panel ────────────────────────────────────────────────────────
function StaffPanel({ member, allServices }) {
  const [open, setOpen] = useState(false)

  // Build a map of dayOfWeek → wh object from existing working hours
  const whByDay = Object.fromEntries((member.workingHours ?? []).map((wh) => [wh.dayOfWeek, wh]))

  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Card header */}
      <button
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, backgroundColor: hovered ? '#FAF8F6' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.12s' }}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Avatar name={member.fullName} src={member.avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: NEAR_BLACK, margin: 0 }}>{member.fullName}</p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{member.phone}</p>
        </div>
        <Badge color={member.role === 'OWNER' ? 'primary' : 'gray'}>
          {member.role}
        </Badge>
        {open ? <ChevronUp size={16} color={MUTED} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color={MUTED} style={{ flexShrink: 0 }} />}
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: 16, backgroundColor: '#FDFAFB', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Public profile */}
          <StaffProfileEditor member={member} />

          {/* Working hours */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: NEAR_BLACK, margin: '0 0 12px' }}>Working hours</h3>
            <div>
              {DAYS.map((_, day) => (
                <HoursRow key={day} staffId={member.id} day={day} wh={whByDay[day]} />
              ))}
            </div>
          </div>

          {/* Services */}
          {allServices.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: NEAR_BLACK, margin: '0 0 12px' }}>Assigned services</h3>
              <ServiceAssignment
                staffId={member.id}
                assignedIds={member.assignedServiceIds ?? []}
                services={allServices}
              />
            </div>
          )}

          {/* PIN */}
          {(member.role !== 'OWNER' || member.isAlsoStaff) && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: NEAR_BLACK, margin: '0 0 12px' }}>PIN login</h3>
              <PinSetter staffId={member.id} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Staff() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: staffData, loading: staffLoading, error: staffError } = useQuery(STAFF_LIST)
  const { data: serviceData } = useQuery(SERVICES, { variables: { activeOnly: true } })

  const members = staffData?.staffList ?? []
  const services = serviceData?.services ?? []

  return (
    <PageWrapper>
      <PageHeader
        title="Staff"
        subtitle="Manage your team, hours, and services"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add staff
          </Button>
        }
      />

      {staffLoading && <PageSpinner />}
      {staffError && <ErrorMessage message={staffError.message} />}

      <div className="space-y-3">
        {members.map((member) => (
          <StaffPanel key={member.id} member={member} allServices={services} />
        ))}
      </div>

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
        />
      )}
    </PageWrapper>
  )
}
