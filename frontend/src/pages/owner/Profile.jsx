import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { User, Lock, Camera, Pencil, AlertTriangle, Smartphone, KeyRound, Copy, RefreshCw, Check, ExternalLink } from 'lucide-react'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { UPDATE_MY_PROFILE, CHANGE_PASSWORD } from '../../graphql/mutations/staff'
import { UPDATE_TENANT_PROFILE, DELETE_TENANT, SET_STAFF_ACCESS_KEY } from '../../graphql/mutations/tenant'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Input from '../../components/ui/Input'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'
import { getInitials } from '../../lib/utils'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#5C4C3D'
const HINT   = '#8A7A6A'
const BORDER = '#EDE3D6'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

const cardStyle = {
  backgroundColor: '#fff',
  border: `0.5px solid ${BORDER}`,
  borderRadius: 14,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
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

const savedSpan = { fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#2d6a4f' }

const primaryBtn = (disabled) => ({
  padding: '9px 24px',
  backgroundColor: disabled ? '#d4a8b0' : BURG,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontFamily: sans,
  fontSize: 10,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const outlineBtn = {
  padding: '7px 20px',
  backgroundColor: 'transparent',
  color: BURG,
  border: `0.5px solid ${BORDER}`,
  borderRadius: 10,
  fontFamily: sans,
  fontSize: 10,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

const ghostBtn = {
  background: 'none',
  border: 'none',
  fontFamily: sans,
  fontSize: 12,
  fontWeight: 300,
  color: MUTED,
  cursor: 'pointer',
  padding: 0,
}

function FieldRow({ label, value, note, isLast }) {
  return (
    <div style={{
      display: 'flex',
      paddingBottom: isLast ? 0 : 14,
      marginBottom: isLast ? 0 : 14,
      borderBottom: isLast ? 'none' : `0.5px solid ${BORDER}`,
    }}>
      <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: 0, width: 140, flexShrink: 0 }}>{label}</p>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>{value || '-'}</p>
        {note && <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: '3px 0 0' }}>{note}</p>}
      </div>
    </div>
  )
}

// ── Personal details ──────────────────────────────────────────────────────────

function PersonalDetailsCard({ profile }) {
  const { setProfile } = useAuth()
  const fileRef = useRef()
  const [editing, setEditing]     = useState(false)
  const [fullName, setFullName]   = useState(profile.fullName)
  const [phone, setPhone]         = useState(profile.phone || '')
  const [saved, setSaved]         = useState(false)
  const [fileError, setFileError] = useState(null)

  const [updateMyProfile, { loading, error }] = useMutation(UPDATE_MY_PROFILE, {
    onCompleted: (data) => {
      setProfile(data.updateMyProfile)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function save() {
    updateMyProfile({ variables: { fullName: fullName.trim(), phone: phone.trim() } })
  }

  function cancel() {
    setFullName(profile.fullName)
    setPhone(profile.phone || '')
    setEditing(false)
  }

  function handleAvatarFile(e) {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFileError('Only JPG and PNG files are accepted.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('File must be under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateMyProfile({ variables: { avatarUrl: ev.target.result } })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={cardStyle}>
      <h2 style={headingStyle}>
        <User size={17} color={BURG} />
        Personal details
      </h2>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              style={{ width: 64, height: 64, objectFit: 'cover', display: 'block', border: `0.5px solid ${BORDER}`, borderRadius: '50%' }}
            />
          ) : (
            <div style={{ width: 64, height: 64, backgroundColor: BURG, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
              <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 400, color: '#fff' }}>{getInitials(profile.fullName)}</span>
            </div>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 20, height: 20,
              backgroundColor: '#000',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Camera size={11} />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleAvatarFile} />
        </div>
        <div>
          <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 2px' }}>{profile.fullName}</p>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: 0, textTransform: 'capitalize' }}>{profile.role?.toLowerCase()}</p>
        </div>
      </div>

      {fileError && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#dc2626', margin: 0 }}>{fileError}</p>}
      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 97 000 0000" autoComplete="tel" />
        </div>
      ) : (
        <div>
          <FieldRow label="Full name" value={profile.fullName} />
          <FieldRow label="Phone" value={profile.phone} />
          <FieldRow label="Email" value={profile.email} note="Contact support to change your email." isLast />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {editing ? (
          <>
            <button onClick={save} disabled={loading} style={primaryBtn(loading)}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={cancel} style={ghostBtn}>Cancel</button>
          </>
        ) : (
          <button style={outlineBtn} onClick={() => setEditing(true)}>
            <Pencil size={11} />
            Edit
          </button>
        )}
        {saved && <span style={savedSpan}>Profile updated ✓</span>}
      </div>
    </div>
  )
}

// ── Contact & payments ────────────────────────────────────────────────────────

function ContactPaymentsCard({ settings, refetchSettings }) {
  const [editing, setEditing]                   = useState(false)
  const [phone, setPhone]                       = useState(settings.phone || '')
  const [payoutPhone, setPayoutPhone]           = useState(settings.payoutPhone || '')
  const [payoutNetwork, setPayoutNetwork]       = useState(settings.payoutNetwork || '')
  const [whatsappNumber, setWhatsappNumber]     = useState(settings.whatsappNumber || '')
  const [saved, setSaved]                       = useState(false)

  const [updateTenantProfile, { loading, error }] = useMutation(UPDATE_TENANT_PROFILE, {
    onCompleted: () => {
      setEditing(false)
      setSaved(true)
      refetchSettings()
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function save() {
    updateTenantProfile({
      variables: {
        phone: phone.trim(),
        payoutPhone: payoutPhone.trim(),
        payoutNetwork: payoutNetwork,
        whatsappNumber: whatsappNumber.trim(),
      },
    })
  }

  function cancel() {
    setPhone(settings.phone || '')
    setPayoutPhone(settings.payoutPhone || '')
    setPayoutNetwork(settings.payoutNetwork || '')
    setWhatsappNumber(settings.whatsappNumber || '')
    setEditing(false)
  }

  return (
    <div style={cardStyle}>
      <h2 style={headingStyle}>
        <Smartphone size={17} color={BURG} />
        Contact & Payments
      </h2>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Contact number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 97 000 0000" />
          <div>
            <Input label="Mobile money number" type="tel" value={payoutPhone} onChange={(e) => setPayoutPhone(e.target.value)} placeholder="+260 97 000 0000" />
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: '4px 0 0' }}>Kimawa sends your earnings to this number.</p>
          </div>
          <div>
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, color: TEXT, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mobile network</p>
            <select
              value={payoutNetwork}
              onChange={(e) => setPayoutNetwork(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #C9B49C', borderRadius: 10, background: '#fff', fontFamily: sans, fontSize: 13, color: TEXT, outline: 'none', appearance: 'none' }}
            >
              <option value="">Select network</option>
              <option value="mtn">MTN Money</option>
              <option value="airtel">Airtel Money</option>
              <option value="zamtel">Zamtel Kwacha</option>
            </select>
          </div>
          <div>
            <Input label="WhatsApp number" type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+260 97 000 0000" />
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: '4px 0 0' }}>We send booking notifications to this number.</p>
          </div>
        </div>
      ) : (
        <div>
          <FieldRow label="Contact number" value={settings.phone} />
          <FieldRow label="Mobile money" value={settings.payoutPhone} />
          <FieldRow label="Network" value={{ mtn: 'MTN Money', airtel: 'Airtel Money', zamtel: 'Zamtel Kwacha' }[settings.payoutNetwork] || 'N/A'} />
          <FieldRow label="WhatsApp" value={settings.whatsappNumber} isLast />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {editing ? (
          <>
            <button onClick={save} disabled={loading} style={primaryBtn(loading)}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={cancel} style={ghostBtn}>Cancel</button>
          </>
        ) : (
          <button style={outlineBtn} onClick={() => setEditing(true)}>
            <Pencil size={11} />
            Edit
          </button>
        )}
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Change password ───────────────────────────────────────────────────────────

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState(null)
  const [saved, setSaved]                     = useState(false)

  const [changePassword, { loading, error }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    },
  })

  function submit(e) {
    e.preventDefault()
    setValidationError(null)
    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }
    changePassword({ variables: { currentPassword, newPassword } })
  }

  return (
    <div style={cardStyle}>
      <h2 style={headingStyle}>
        <Lock size={17} color={BURG} />
        Change password
      </h2>

      {validationError && <ErrorMessage message={validationError} />}
      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not change password.'} />}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
        <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
        <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Changing…' : 'Change password'}
          </button>
          {saved && <span style={savedSpan}>Password changed ✓</span>}
        </div>
      </form>
    </div>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerZoneCard() {
  const [confirm, setConfirm] = useState('')
  const [open, setOpen]       = useState(false)

  const { data: settingsData } = useQuery(SALON_SETTINGS)
  const businessName = settingsData?.salonSettings?.businessName ?? ''

  const [deleteTenant, { loading, error }] = useMutation(DELETE_TENANT, {
    onCompleted: () => {
      const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
      window.location.href = appDomain ? `https://${appDomain}` : 'http://localhost:3000'
    },
  })

  function submit(e) {
    e.preventDefault()
    deleteTenant({ variables: { confirm } })
  }

  return (
    <div style={{ backgroundColor: '#FFF8F8', border: '0.5px solid #F0C8C8', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ ...headingStyle, color: '#8B1A1A' }}>
        <AlertTriangle size={17} />
        Danger zone
      </h2>
      <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#dc2626', margin: 0 }}>
        Permanently delete your business account and all associated data. This cannot be undone.
      </p>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#dc2626', cursor: 'pointer', padding: 0, textDecoration: 'underline', textAlign: 'left' }}
        >
          Delete my account
        </button>
      )}

      {open && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#b91c1c', margin: 0 }}>
            Type <strong>{businessName}</strong> to confirm deletion.
          </p>
          <Input label="Business name" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={businessName} />
          {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not delete account.'} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="submit"
              disabled={loading || confirm !== businessName}
              style={{
                padding: '9px 24px',
                backgroundColor: loading || confirm !== businessName ? '#fca5a5' : '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading || confirm !== businessName ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirm('') }}
              style={ghostBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Staff access ──────────────────────────────────────────────────────────────

function generateKey() {
  const words = ['GLOW', 'SALON', 'BEAUTY', 'SHINE', 'STYLE', 'GRACE']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}${num}`
}

function StaffAccessCard({ currentKey }) {
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
    borderRadius: 10,
    backgroundColor: '#fff',
    color: MUTED,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const staffUrl = `${window.location.origin}/staff`

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={headingStyle}>
          <KeyRound size={17} color={BURG} />
          Staff access
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '6px 0 0' }}>
          Give your team a key to view today&apos;s appointments, and share your storefront link with customers.
        </p>
      </div>

      <a
        href={window.location.origin}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 500, color: BURG, textDecoration: 'none', width: 'fit-content' }}
      >
        View your storefront
        <ExternalLink size={13} />
      </a>

      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      <div>
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, color: TEXT, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Team access key
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. GLOW2024"
            style={{ flex: 1, ...fieldStyleInput, fontSize: 16, fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = '#C9B49C')}
          />
          <button onClick={copy} title="Copy key" style={iconBtn}>
            {copied ? <Check size={16} color="#2d6a4f" /> : <Copy size={16} />}
          </button>
          <button onClick={() => setKey(generateKey())} title="Generate new key" style={iconBtn}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={save} disabled={loading || !key.trim() || key.trim() === currentKey} style={primaryBtn(loading || !key.trim() || key.trim() === currentKey)}>
          {loading ? 'Saving…' : 'Save key'}
        </button>
        {saved && <span style={savedSpan}>Saved ✓</span>}
      </div>

      <div style={{ backgroundColor: '#FBF7F1', border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT, margin: '0 0 8px' }}>How your team uses it</p>
        <ol style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0, paddingLeft: 18, lineHeight: 2.2 }}>
          <li>Send them <span style={{ fontWeight: 400, color: TEXT }}>{staffUrl}</span></li>
          <li>They enter the key: <span style={{ fontWeight: 500, color: BURG }}>{key || '-'}</span></li>
          <li>Typing their name filters to just their appointments</li>
        </ol>
      </div>
    </div>
  )
}

const fieldStyleInput = {
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

// ── Page ──────────────────────────────────────────────────────────────────────

const PROFILE_SECTIONS = [
  { key: 'personal', label: 'Personal' },
  { key: 'contact',  label: 'Contact & Payments' },
  // 'access' (Staff Access) hidden for now — bringing it back later.
  // StaffAccessCard and its render branch below are left in place.
  { key: 'security', label: 'Security' },
  { key: 'danger',   label: 'Danger Zone' },
]

function profilePill(active) {
  return {
    fontFamily: sans, fontSize: 13, fontWeight: 500,
    padding: '10px 18px', borderRadius: 999, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.1s',
    backgroundColor: active ? BURG : '#fff',
    color: active ? '#fff' : TEXT,
    border: active ? 'none' : `0.5px solid ${BORDER}`,
  }
}

export default function Profile() {
  const { data, loading, error } = useQuery(MY_PROFILE)
  const { data: settingsData, refetch: refetchSettings } = useQuery(SALON_SETTINGS)
  const [section, setSection] = useState('personal')

  return (
    <PageWrapper>
      <PageHeader title="Profile" subtitle="Manage your personal account details" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data?.myProfile && (
        <div style={{ maxWidth: 560 }}>
          <div
            className="profile-pill-row"
            style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, marginBottom: 24 }}
          >
            {PROFILE_SECTIONS.map((t) => (
              <button key={t.key} type="button" onClick={() => setSection(t.key)} style={profilePill(section === t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <style>{`.profile-pill-row::-webkit-scrollbar { display: none; }`}</style>

          {section === 'personal' && <PersonalDetailsCard profile={data.myProfile} />}
          {section === 'contact' && settingsData?.salonSettings && (
            <ContactPaymentsCard
              settings={settingsData.salonSettings}
              refetchSettings={refetchSettings}
            />
          )}
          {section === 'access' && settingsData?.salonSettings && (
            <StaffAccessCard currentKey={settingsData.salonSettings.staffAccessKey} />
          )}
          {section === 'security' && <ChangePasswordCard />}
          {section === 'danger' && <DangerZoneCard />}
        </div>
      )}
    </PageWrapper>
  )
}
