import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { Search, Users } from 'lucide-react'
import { CUSTOMERS } from '../../graphql/queries/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { ErrorMessage } from '../../components/ui/Spinner'

const PRIMARY = '#6B2737'
const MUTED   = '#8B4A5A'
const BORDER  = '#D4B0B8'

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
  if (!iso) return '—'
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

function Avatar({ name }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      backgroundColor: name?.trim() ? PRIMARY : '#9ca3af',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{initials(name)}</span>
    </div>
  )
}

function SkeletonRow() {
  const bar = (w) => (
    <div style={{ height: 12, backgroundColor: '#f3f4f6', borderRadius: 4, width: w }} />
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `0.5px solid ${BORDER}44` }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f3f4f6', flexShrink: 0 }} />
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

function CustomerRow({ customer }) {
  const displayName = customer.fullName?.trim() || 'Unknown'
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `0.5px solid ${BORDER}44`, transition: 'background 0.1s' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf8f6')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <Avatar name={customer.fullName} />

      {/* Name + phone */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </p>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{customer.phone}</p>
      </div>

      {/* Visits */}
      <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{customer.visitCount}</p>
        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>visits</p>
      </div>

      {/* Last visit */}
      <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: '#1a1a1a', margin: 0 }}>{timeAgo(customer.lastVisitAt)}</p>
        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>last visit</p>
      </div>

      {/* No-shows — only rendered when > 0, otherwise spacer */}
      <div style={{ minWidth: 44, textAlign: 'center', flexShrink: 0 }}>
        {customer.noShowCount > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#dc2626', margin: 0 }}>{customer.noShowCount}</p>
            <p style={{ fontSize: 10, color: '#dc262688', margin: 0 }}>no-show{customer.noShowCount > 1 ? 's' : ''}</p>
          </>
        )}
      </div>
    </div>
  )
}

function ColHeader({ children, style }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, color: MUTED, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', ...style }}>
      {children}
    </p>
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
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px 10px 36px',
            border: `1px solid ${BORDER}`,
            borderRadius: 10, fontSize: 13, color: '#1a1a1a',
            outline: 'none', backgroundColor: '#fff',
          }}
          onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
          onBlur={(e) => (e.target.style.borderColor = BORDER)}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', backgroundColor: '#faf8f6', borderBottom: `0.5px solid ${BORDER}` }}>
          <div style={{ width: 36, flexShrink: 0 }} />
          <ColHeader style={{ flex: 1 }}>Customer</ColHeader>
          <ColHeader style={{ minWidth: 44, textAlign: 'center' }}>Visits</ColHeader>
          <ColHeader style={{ minWidth: 72, textAlign: 'right' }}>Last seen</ColHeader>
          <div style={{ minWidth: 44 }} />
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Users size={32} style={{ color: BORDER, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: '0 0 4px' }}>
              {debouncedSearch ? 'No customers match your search' : 'No customers yet'}
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
              {debouncedSearch
                ? 'Try a different name or phone number.'
                : 'Customers appear here automatically after their first booking.'}
            </p>
          </div>
        ) : (
          customers.map((c) => <CustomerRow key={c.id} customer={c} />)
        )}
      </div>
    </PageWrapper>
  )
}
