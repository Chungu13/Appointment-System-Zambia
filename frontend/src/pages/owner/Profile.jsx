import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { User, Lock, Camera, Pencil } from 'lucide-react'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { UPDATE_MY_PROFILE, CHANGE_PASSWORD } from '../../graphql/mutations/staff'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'
import { getInitials } from '../../lib/utils'

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
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-6">
      <h2 className="font-semibold text-on-surface flex items-center gap-2">
        <User size={18} className="text-primary" />
        Personal details
      </h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-outline-variant"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-xl select-none">
              {getInitials(profile.fullName)}
            </div>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Camera size={11} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarFile}
          />
        </div>
        <div>
          <p className="font-medium text-on-surface">{profile.fullName}</p>
          <p className="text-sm text-on-surface-variant capitalize">{profile.role?.toLowerCase()}</p>
        </div>
      </div>

      {fileError && <p className="text-sm text-error font-medium">{fileError}</p>}
      {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not save.'} />}

      {/* Fields */}
      {editing ? (
        <div className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+260 97 000 0000"
            autoComplete="tel"
          />
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <span className="text-on-surface-variant">Full name</span>
            <span className="text-on-surface font-medium">{profile.fullName}</span>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <span className="text-on-surface-variant">Phone</span>
            <span className="text-on-surface font-medium">{profile.phone || '-'}</span>
          </div>
        </div>
      )}

      {/* Email — always read-only */}
      <div className="text-sm">
        <div className="grid grid-cols-[130px_1fr] gap-2">
          <span className="text-on-surface-variant">Email</span>
          <div>
            <span className="text-on-surface font-medium">{profile.email}</span>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Contact support to change your email.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <Button onClick={save} loading={loading}>Save changes</Button>
            <button
              type="button"
              onClick={cancel}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={13} className="mr-1.5 inline-block" />
            Edit
          </Button>
        )}
        {saved && (
          <span className="text-sm text-green-700 font-medium">Profile updated ✓</span>
        )}
      </div>
    </div>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [validationError, setValidationError]   = useState(null)
  const [saved, setSaved]                       = useState(false)

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
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5">
      <h2 className="font-semibold text-on-surface flex items-center gap-2">
        <Lock size={18} className="text-primary" />
        Change password
      </h2>

      {validationError && <ErrorMessage message={validationError} />}
      {error && (
        <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Could not change password.'} />
      )}

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={loading}>Change password</Button>
          {saved && (
            <span className="text-sm text-green-700 font-medium">Password changed ✓</span>
          )}
        </div>
      </form>
    </div>
  )
}

export default function Profile() {
  const { data, loading, error } = useQuery(MY_PROFILE)

  return (
    <PageWrapper>
      <PageHeader title="Profile" subtitle="Manage your personal account details" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data?.myProfile && (
        <div className="max-w-lg space-y-6">
          <PersonalDetailsCard profile={data.myProfile} />
          <ChangePasswordCard />
        </div>
      )}
    </PageWrapper>
  )
}
