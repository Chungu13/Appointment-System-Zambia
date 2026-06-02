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
import { classNames } from '../../lib/utils'

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
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Add staff member</h2>
          <button onClick={onClose}><X size={20} className="text-on-surface-variant" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Error'} />}

          {/* "This is me" toggle */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-primary/30 bg-primary-container/30 cursor-pointer">
            <input
              type="checkbox"
              checked={isMe}
              onChange={(e) => toggleIsMe(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-on-surface">This is me (I also do the work)</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tick this if you're the sole operator. Your appointments will show on the dashboard.
              </p>
            </div>
          </label>

          {isMe ? (
            /* Solo-operator mode: just set a PIN */
            <div className="space-y-3">
              <div className="rounded-xl bg-surface-container p-3 text-sm text-on-surface-variant">
                <p className="font-medium text-on-surface">{profile?.fullName}</p>
                <p>{profile?.phone}</p>
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
            /* Normal mode: create a separate staff account */
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

  return (
    <div className="flex items-center gap-3 py-2 border-b border-outline-variant/40 last:border-0">
      <span className="w-24 text-sm font-medium text-on-surface shrink-0">{DAYS[day]}</span>

      {/* Day off toggle */}
      <button
        type="button"
        onClick={() => setIsDayOff((v) => !v)}
        className={classNames(
          'w-8 h-4 rounded-full transition-colors shrink-0',
          isDayOff ? 'bg-outline-variant' : 'bg-primary'
        )}
      >
        <span className={classNames(
          'block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5',
          isDayOff ? 'translate-x-0' : 'translate-x-4'
        )} />
      </button>
      <span className="text-xs text-on-surface-variant w-12 shrink-0">{isDayOff ? 'Day off' : 'Open'}</span>

      {!isDayOff && (
        <>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="text-sm border border-outline-variant rounded-lg px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-28"
          />
          <span className="text-xs text-on-surface-variant">-</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="text-sm border border-outline-variant rounded-lg px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-28"
          />
        </>
      )}

      <div className="ml-auto">
        {saved ? (
          <span className="text-xs text-green-700 font-medium">Saved ✓</span>
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
    <div className="grid grid-cols-2 gap-2">
      {services.map((s) => {
        const on = assignedIds.includes(s.id)
        return (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={classNames(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-left transition-colors',
              on
                ? 'border-primary bg-primary-container text-on-primary-container'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <span className={classNames('w-3 h-3 rounded-full shrink-0', on ? 'bg-primary' : 'bg-outline-variant')} />
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
      <h3 className="text-sm font-semibold text-on-surface mb-3">Public profile</h3>
      <div className="flex gap-4 items-start">
        {/* Avatar upload */}
        <div className="shrink-0">
          {avatarPreview ? (
            <div className="relative w-20 h-20">
              <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-outline-variant" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center border-2 border-surface-container-lowest hover:bg-primary/90 transition-colors"
              >
                <Camera size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]) }}
              className={`w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container'}`}
            >
              <Camera size={18} className="text-on-surface-variant" />
              <span className="text-xs text-on-surface-variant">Photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
        </div>

        {/* Bio + visibility */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-1">Short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="e.g. 5 years experience in braiding and natural hair"
              className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={togglePublic}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${isPublic ? 'border-primary/40 bg-primary-container/40 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
            >
              {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
              {isPublic ? 'Shown on public page' : 'Hidden from public page'}
            </button>

            <div className="flex items-center gap-2">
              {saved && <span className="text-xs text-green-700 font-medium">Saved ✓</span>}
              <button
                onClick={save}
                disabled={loading}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
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

  return (
    <div className="rounded-2xl border border-outline-variant overflow-hidden">
      {/* Card header */}
      <button
        className="w-full flex items-center gap-4 p-4 hover:bg-surface-container/50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={member.fullName} src={member.avatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface">{member.fullName}</p>
          <p className="text-sm text-on-surface-variant">{member.phone}</p>
        </div>
        <Badge color={member.role === 'OWNER' ? 'primary' : 'gray'}>
          {member.role}
        </Badge>
        {open ? <ChevronUp size={18} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={18} className="text-on-surface-variant shrink-0" />}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-outline-variant p-4 bg-surface-container/30 space-y-6">
          {/* Public profile */}
          <StaffProfileEditor member={member} />

          {/* Working hours */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">Working hours</h3>
            <div>
              {DAYS.map((_, day) => (
                <HoursRow key={day} staffId={member.id} day={day} wh={whByDay[day]} />
              ))}
            </div>
          </div>

          {/* Services */}
          {allServices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">Assigned services</h3>
              <ServiceAssignment
                staffId={member.id}
                assignedIds={member.assignedServiceIds ?? []}
                services={allServices}
              />
            </div>
          )}

          {/* PIN — shown for staff, and for owners who are also practitioners */}
          {(member.role !== 'OWNER' || member.isAlsoStaff) && (
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">PIN login</h3>
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
