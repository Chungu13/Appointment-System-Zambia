import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { KeyRound, Copy, Check, RefreshCw, Camera, X } from 'lucide-react'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { SET_STAFF_ACCESS_KEY, UPDATE_TENANT_PROFILE } from '../../graphql/mutations/tenant'
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
          <StaffKeyCard currentKey={data.salonSettings.staffAccessKey} />
        </div>
      )}
    </PageWrapper>
  )
}
