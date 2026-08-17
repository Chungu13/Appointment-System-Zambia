import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { Search, Users } from 'lucide-react'
import { CUSTOMERS } from '../../graphql/queries/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { ErrorMessage } from '../../components/ui/Spinner'

const BURG    = '#3B2A1E'
const TEXT    = '#241812'
const MUTED   = '#5C4C3D'
const HINT    = '#8A7A6A'
const BORDER  = '#EDE3D6'
const BLUSH   = '#FBF7F1'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function timeAgo(iso) {
  if (!iso) return 'N/A'
  const diffMs = Date.now() - new Date(iso)
  const d = Math.floor(diffMs / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  const dt = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[dt.getMonth()]} ${dt.getDate()}`
}

function initials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CustomerAvatar({ name }) {
  return (
    <div style={{
      width: 36, height: 36, flexShrink: 0,
      backgroundColor: BURG, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#fff' }}>{initials(name)}</span>
    </div>
  )
}

function SkeletonRow() {
  const bar = (w) => (
    <div style={{ height: 11, backgroundColor: '#f3f4f6', width: w }} />
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
      <div style={{ width: 36, height: 36, backgroundColor: '#f3f4f6', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bar('42%')}
        {bar('26%')}
      </div>
      {bar(28)}
      {bar(52)}
      <div style={{ width: 44 }} />
    </div>
  )
}

function CustomerRow({ customer, isLast }) {
  const navigate = useNavigate()
  const displayName = customer.fullName?.trim() || 'Unknown'
  return (
    <div
      role="button"
      onClick={() => navigate(`/owner/customers/${customer.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : `0.5px solid ${BORDER}`,
        transition: 'background 0.1s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUSH)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <CustomerAvatar name={customer.fullName} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </p>
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: MUTED, margin: 0 }}>{customer.phone}</p>
      </div>

      <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: TEXT, margin: 0 }}>{customer.visitCount}</p>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT, margin: 0 }}>visits</p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>{timeAgo(customer.lastVisitAt)}</p>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT, margin: 0 }}>last visit</p>
      </div>

      <div style={{ minWidth: 44, textAlign: 'center', flexShrink: 0 }}>
        {customer.noShowCount > 0 && (
          <>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#dc2626', margin: 0 }}>{customer.noShowCount}</p>
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: '#dc262688', margin: 0 }}>no-show{customer.noShowCount > 1 ? 's' : ''}</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Customers() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, loading, error } = useQuery(CUSTOMERS)

  const customers = useMemo(() => {
    const all = data?.customers ?? []
    if (!debouncedSearch.trim()) return all
    const q = debouncedSearch.toLowerCase()
    return all.filter(
      (c) => c.fullName?.toLowerCase().includes(q) || c.phone?.includes(q),
    )
  }, [data, debouncedSearch])

  const total = data?.customers?.length ?? 0

  return (
    <PageWrapper>
      <PageHeader
        title="Customers"
        subtitle={loading ? 'Loading…' : `${total} customer${total !== 1 ? 's' : ''}`}
      />

      {error && <ErrorMessage message={error.message} />}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: HINT, pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="customer-search"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '11px 14px 11px 38px',
            border: `0.5px solid ${BORDER}`, borderRadius: 10,
            fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT,
            outline: 'none', backgroundColor: '#fff',
          }}
          onFocus={(e) => (e.target.style.borderColor = BURG)}
          onBlur={(e) => (e.target.style.borderColor = BORDER)}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', backgroundColor: '#FBF7F1', borderBottom: `0.5px solid ${BORDER}` }}>
          <div style={{ width: 36, flexShrink: 0 }} />
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0, flex: 1 }}>Customer</p>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0, minWidth: 44, textAlign: 'center' }}>Visits</p>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0, minWidth: 72, textAlign: 'right' }}>Last seen</p>
          <div style={{ minWidth: 44 }} />
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Users size={28} style={{ color: '#d4a8b0', marginBottom: 12 }} />
            <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: TEXT, margin: '0 0 6px' }}>
              {debouncedSearch ? 'No customers match your search' : 'No customers yet'}
            </p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0 }}>
              {debouncedSearch
                ? 'Try a different name or phone number.'
                : 'Customers appear here automatically after their first booking.'}
            </p>
          </div>
        ) : (
          customers.map((c, i) => <CustomerRow key={c.id} customer={c} isLast={i === customers.length - 1} />)
        )}
      </div>
    </PageWrapper>
  )
}
