import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { KeyRound, Copy, Check, RefreshCw } from 'lucide-react'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import { SET_STAFF_ACCESS_KEY } from '../../graphql/mutations/tenant'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { ErrorMessage, PageSpinner } from '../../components/ui/Spinner'

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
          <StaffKeyCard currentKey={data.salonSettings.staffAccessKey} />
        </div>
      )}
    </PageWrapper>
  )
}
