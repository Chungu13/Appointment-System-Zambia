import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { ArrowLeft, Phone, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { CUSTOMER_DETAIL, CUSTOMER_APPOINTMENTS_BY_ID } from '../../graphql/queries/bookings'
import PageWrapper from '../../components/layout/PageWrapper'

const BURG   = '#6B2737'
const TEXT   = '#1a0a0d'
const MUTED  = '#7a5060'
const HINT   = '#8a6268'
const BORDER = '#ede5e7'
const BLUSH  = '#fdf8f8'
const sans   = "'Inter', sans-serif"

const STATUS_LABEL = {
  completed:   { label: 'Completed',   color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  confirmed:   { label: 'Confirmed',   color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  cancelled:   { label: 'Cancelled',   color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  no_show:     { label: 'No-show',     color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  in_progress: { label: 'In progress', color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  pending:     { label: 'Pending',     color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  expired:     { label: 'Expired',     color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

function formatDate(iso) {
  if (!iso) return 'N/A'
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m} ${ampm}`
}

function timeAgo(iso) {
  if (!iso) return 'N/A'
  const diffMs = Date.now() - new Date(iso)
  const d = Math.floor(diffMs / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return formatDate(iso)
}

function initials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function StatCard({ icon: Icon, label, value, sub, valueColor }) {
  return (
    <div style={{ flex: 1, minWidth: 100, border: `0.5px solid ${BORDER}`, padding: '16px 18px', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={MUTED} />
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: valueColor || TEXT, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: MUTED, bg: BLUSH, border: BORDER }
  return (
    <span style={{
      fontFamily: sans, fontSize: 10, fontWeight: 400,
      color: s.color, backgroundColor: s.bg,
      border: `0.5px solid ${s.border}`,
      padding: '2px 8px', letterSpacing: '0.06em',
    }}>
      {s.label}
    </span>
  )
}

function BookingRow({ appt, isLast }) {
  const paid = appt.payments?.filter((p) => p.status?.toLowerCase() === 'completed')
  const paidTotal = paid?.reduce((sum, p) => sum + (p.amountZmw || 0), 0) ?? 0
  const servicePrice = appt.service?.priceZmw ?? 0
  const addonTotal = appt.addonServices?.reduce((s, a) => s + (a.priceZmw || 0), 0) ?? 0
  const fullPrice = servicePrice + addonTotal

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto',
      gap: 12,
      alignItems: 'center',
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : `0.5px solid ${BORDER}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>
          {appt.service?.name || 'N/A'}
        </p>
        {appt.addonServices?.length > 0 && (
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT, margin: '2px 0 0' }}>
            + {appt.addonServices.map((a) => a.name).join(', ')}
          </p>
        )}
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: '3px 0 0' }}>
          {appt.staff?.fullName || 'Staff'} · {formatDate(appt.startsAt)} at {formatTime(appt.startsAt)}
        </p>
      </div>

      <StatusBadge status={appt.status?.toLowerCase?.()} />

      <div style={{ textAlign: 'right', minWidth: 64 }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>
          ZMW {fullPrice.toLocaleString()}
        </p>
        {paidTotal > 0 && paidTotal < fullPrice && (
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT, margin: '2px 0 0' }}>
            dep: ZMW {paidTotal.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const customerId = parseInt(id, 10)

  const { data: custData, loading: custLoading } = useQuery(CUSTOMER_DETAIL, {
    variables: { id: customerId },
    skip: !customerId,
  })

  const { data: apptData, loading: apptLoading } = useQuery(CUSTOMER_APPOINTMENTS_BY_ID, {
    variables: { customerId },
    skip: !customerId,
  })

  const customer = custData?.customer
  const appointments = apptData?.customerAppointmentsById ?? []

  const totalSpent = appointments
    .filter((a) => a.status?.toLowerCase?.() === 'completed')
    .reduce((sum, a) => {
      const base = a.service?.priceZmw ?? 0
      const addons = a.addonServices?.reduce((s, x) => s + (x.priceZmw || 0), 0) ?? 0
      return sum + base + addons
    }, 0)

  const loading = custLoading || apptLoading

  return (
    <PageWrapper>
      {/* Back */}
      <button
        onClick={() => navigate('/owner/customers')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: '0 0 20px', cursor: 'pointer',
          fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED,
        }}
      >
        <ArrowLeft size={14} />
        All customers
      </button>

      {loading ? (
        <div style={{ border: `0.5px solid ${BORDER}`, padding: '48px 24px', textAlign: 'center', backgroundColor: '#fff' }}>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0 }}>Loading…</p>
        </div>
      ) : !customer ? (
        <div style={{ border: `0.5px solid ${BORDER}`, padding: '48px 24px', textAlign: 'center', backgroundColor: '#fff' }}>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: 0 }}>Customer not found.</p>
        </div>
      ) : (
        <>
          {/* Header card */}
          <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: '24px 24px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52, height: 52, backgroundColor: BURG, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 400, color: '#fff' }}>
                  {initials(customer.fullName)}
                </span>
              </div>
              <div>
                <h1 style={{ fontFamily: sans, fontSize: 20, fontWeight: 500, color: TEXT, margin: '0 0 4px' }}>
                  {customer.fullName || 'Unknown'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12} color={MUTED} />
                  <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>{customer.phone}</span>
                </div>
              </div>
            </div>
            {customer.notes && (
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, margin: '14px 0 0', borderTop: `0.5px solid ${BORDER}`, paddingTop: 12 }}>
                {customer.notes}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <StatCard icon={Calendar} label="Total visits" value={customer.visitCount} sub={`Last: ${timeAgo(customer.lastVisitAt)}`} />
            <StatCard icon={TrendingUp} label="Total spent" value={`ZMW ${totalSpent.toLocaleString()}`} sub="completed bookings" />
            <StatCard
              icon={AlertCircle}
              label="No-shows"
              value={customer.noShowCount}
              valueColor={customer.noShowCount > 0 ? '#dc2626' : TEXT}
            />
          </div>

          {/* Booking history */}
          <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}` }}>
            <div style={{ padding: '12px 20px', borderBottom: `0.5px solid ${BORDER}`, backgroundColor: BLUSH }}>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>
                Booking history · {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: 0 }}>No appointments yet.</p>
              </div>
            ) : (
              appointments.map((a, i) => (
                <BookingRow key={a.id} appt={a} isLast={i === appointments.length - 1} />
              ))
            )}
          </div>
        </>
      )}
    </PageWrapper>
  )
}
