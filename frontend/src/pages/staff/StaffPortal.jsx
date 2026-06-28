import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Search, X, ChevronDown } from 'lucide-react'
import { ALL_APPOINTMENTS_TODAY } from '../../graphql/queries/tenant'
import { VERIFY_STAFF_KEY } from '../../graphql/mutations/tenant'
import { toDateInputValue, addDays, formatTime } from '../../lib/utils'

const BURG      = '#6B2737'
const DARK_BURG = '#4A1A25'
const TEXT      = '#1a0a0d'
const MUTED     = '#b09090'
const HINT      = '#c0a8a8'
const BORDER    = '#ede5e7'
const OFF_WHITE = '#faf7f7'

const sans  = "'Inter', sans-serif"

const SESSION_KEY = 'beautybook_staff_key'

function getStoredKey() {
  try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' }
}
function storeKey(k) {
  try { sessionStorage.setItem(SESSION_KEY, k) } catch {}
}
function clearStoredKey() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

function splitTime(str) {
  const parts = (str || '').split(' ')
  return { t: parts[0] || '', period: parts[1] || '' }
}

// ── Step 1: Key entry ─────────────────────────────────────────────────────────
function KeyEntry({ onVerified }) {
  const [key, setKey]     = useState('')
  const [error, setError] = useState('')
  const [verifyKey, { loading }] = useMutation(VERIFY_STAFF_KEY)

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await verifyKey({ variables: { key: key.trim() } })
      if (data?.verifyStaffKey) {
        storeKey(key.trim())
        onVerified(key.trim())
      } else {
        setError('Wrong key. Ask your owner for the current staff access key.')
      }
    } catch {
      setError('Could not connect. Try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#fff' }}>

      {/* Left panel — brand */}
      <div
        className="hidden sm:flex"
        style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: DARK_BURG,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 32px',
        }}
      >
        <div>
          <p style={{ fontFamily: sans, fontSize: 22, fontWeight: 400, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
            Kimawa
          </p>
          <div style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', margin: '16px 0 20px' }} />
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7, letterSpacing: '0.02em' }}>
            Your salon,<br />always open.
          </p>
        </div>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: '0.06em' }}>
          kimawa.pro
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 12px' }}>
            Staff portal
          </p>
          <h1 style={{ fontFamily: sans, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 6px', lineHeight: 1.1 }}>
            Staff access
          </h1>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '0 0 32px', lineHeight: 1.6 }}>
            Enter your salon's access key to view today's schedule.
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. GLOW2024"
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 16px',
                border: `0.5px solid ${BORDER}`,
                borderRadius: 0,
                fontSize: 18,
                fontFamily: sans,
                fontWeight: 600,
                textAlign: 'center',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: TEXT,
                backgroundColor: OFF_WHITE,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = BURG)}
              onBlur={(e) => {
                e.target.style.borderColor = BORDER
                if (!key.trim()) setError('Please enter your salon access key.')
              }}
            />
            {error && (
              <p style={{ fontFamily: sans, fontSize: 11, color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!key.trim() || loading}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 0,
                backgroundColor: BURG,
                color: '#fff',
                border: 'none',
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: (!key.trim() || loading) ? 'not-allowed' : 'pointer',
                opacity: (!key.trim() || loading) ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>

          <div style={{ marginTop: 28 }}>
            <a
              href="/"
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, textDecoration: 'none', letterSpacing: '0.04em' }}
            >
              ← Back to directory
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Appointment card ──────────────────────────────────────────────────────────
function AppointmentCard({ appt, faded }) {
  const { t, period } = splitTime(formatTime(appt.startsAt))

  return (
    <div style={{
      backgroundColor: '#fff',
      border: `0.5px solid ${BORDER}`,
      borderLeft: `2px solid ${BURG}`,
      borderRadius: 0,
      padding: '14px 16px',
      display: 'flex',
      gap: 16,
      opacity: faded ? 0.4 : 1,
    }}>
      {/* Time block */}
      <div style={{ flexShrink: 0, width: 52, paddingTop: 2 }}>
        <p style={{ fontFamily: sans, fontSize: 20, fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1 }}>
          {t}
        </p>
        <p style={{ fontFamily: sans, fontSize: 9, fontWeight: 300, color: HINT, margin: '3px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {period}
        </p>
        <p style={{ fontFamily: sans, fontSize: 9, fontWeight: 300, color: HINT, margin: '4px 0 0', letterSpacing: '0.04em' }}>
          {appt.serviceDuration}m
        </p>
      </div>
      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: BURG, margin: '0 0 3px', letterSpacing: '0.01em' }}>
          {appt.staffName}
        </p>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: TEXT, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.customerName}
        </p>
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.serviceName}
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Daily schedule ────────────────────────────────────────────────────
function DaySchedule({ staffKey, onSignOut }) {
  const [nameFilter, setNameFilter] = useState('')
  const [showTomorrow, setShowTomorrow] = useState(false)

  const today    = toDateInputValue()
  const tomorrow = toDateInputValue(addDays(new Date(), 1))

  const { data: todayData, loading: todayLoading, error: todayError, refetch } = useQuery(ALL_APPOINTMENTS_TODAY, {
    variables: { key: staffKey, date: today },
    fetchPolicy: 'network-only',
    pollInterval: 60000,
  })

  const { data: tomorrowData, loading: tomorrowLoading } = useQuery(ALL_APPOINTMENTS_TODAY, {
    variables: { key: staffKey, date: tomorrow },
    skip: !showTomorrow,
    fetchPolicy: 'network-only',
  })

  const todayAppts    = todayData?.allAppointmentsToday ?? []
  const tomorrowAppts = tomorrowData?.allAppointmentsToday ?? []

  const trimmed = nameFilter.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmed) return todayAppts
    return todayAppts.filter((a) => a.staffName.toLowerCase().includes(trimmed))
  }, [todayAppts, trimmed])

  const active = filtered.filter((a) => !['completed', 'cancelled', 'no_show'].includes(a.status))
  const done   = filtered.filter((a) =>  ['completed', 'cancelled', 'no_show'].includes(a.status))

  const isFiltering  = !!trimmed
  const displayCount = isFiltering ? filtered.length : todayAppts.length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: OFF_WHITE }}>

      {/* Burgundy header */}
      <header style={{ backgroundColor: BURG, padding: '32px 24px 28px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: sans, fontSize: 9, fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>
              Today
            </p>
            <h1 style={{ fontFamily: sans, fontSize: 26, fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1.1 }}>
              {new Date().toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
            {isFiltering && filtered[0]?.staffName && (
              <p style={{ fontFamily: sans, fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.65)', margin: '6px 0 0', lineHeight: 1.1 }}>
                {filtered[0].staffName}
              </p>
            )}
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', letterSpacing: '0.04em' }}>
              {displayCount} appointment{displayCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { clearStoredKey(); onSignOut() }}
            style={{
              fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4,
            }}
          >
            Change key
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: OFF_WHITE, borderBottom: `0.5px solid ${BORDER}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: HINT, pointerEvents: 'none' }} />
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filter by staff name…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 34, paddingRight: nameFilter ? 34 : 14,
              paddingTop: 10, paddingBottom: 10,
              border: `0.5px solid ${BORDER}`, borderRadius: 0,
              backgroundColor: '#fff',
              fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT,
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
          {nameFilter && (
            <button
              onClick={() => setNameFilter('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: HINT, display: 'flex', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '20px 24px 60px' }}>

        {todayLoading && (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '48px 0' }}>
            Loading schedule…
          </p>
        )}

        {todayError && (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#b91c1c', textAlign: 'center', padding: '48px 0' }}>
            Could not load schedule.{' '}
            <button onClick={() => refetch()} style={{ fontFamily: sans, color: BURG, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 300, padding: 0 }}>
              Retry
            </button>
          </p>
        )}

        {!todayLoading && todayAppts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: sans, fontSize: 28, fontWeight: 400, color: TEXT, margin: '0 0 8px' }}>All clear</p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: 0 }}>
              No appointments scheduled for today.
            </p>
          </div>
        )}

        {!todayLoading && todayAppts.length > 0 && filtered.length === 0 && isFiltering && (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '48px 0' }}>
            No appointments found for "{nameFilter.trim()}"
          </p>
        )}

        {/* Active appointments */}
        {active.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} faded={false} />
            ))}
          </div>
        )}

        {/* Done today */}
        {done.length > 0 && (
          <div style={{ marginTop: active.length > 0 ? 28 : 0 }}>
            <p style={{ fontFamily: sans, fontSize: 9, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: HINT, margin: '0 0 12px' }}>
              Done today
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {done.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} faded />
              ))}
            </div>
          </div>
        )}

        {/* Tomorrow */}
        <div style={{ marginTop: 36, borderTop: `0.5px solid ${BORDER}`, paddingTop: 20 }}>
          <button
            onClick={() => setShowTomorrow((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, marginBottom: showTomorrow ? 16 : 0, width: '100%',
            }}
          >
            <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED }}>
              Tomorrow's schedule
            </span>
            <ChevronDown
              size={12}
              style={{ color: MUTED, transform: showTomorrow ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
            />
          </button>

          {showTomorrow && (
            tomorrowLoading ? (
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, padding: '16px 0' }}>Loading…</p>
            ) : tomorrowAppts.length === 0 ? (
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, padding: '16px 0' }}>Nothing booked tomorrow.</p>
            ) : (
              <div>
                {tomorrowAppts.map((appt, i) => (
                  <div
                    key={appt.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '10px 0',
                      borderBottom: i < tomorrowAppts.length - 1 ? `0.5px solid ${BORDER}` : 'none',
                    }}
                  >
                    <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: TEXT, width: 52, flexShrink: 0 }}>
                      {formatTime(appt.startsAt)}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: BURG, flexShrink: 0 }}>
                      {appt.staffName}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {appt.customerName}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, flexShrink: 0 }}>
                      {appt.serviceName}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </main>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function StaffPortal() {
  const [staffKey, setStaffKey] = useState(() => getStoredKey())

  if (!staffKey) {
    return <KeyEntry onVerified={(k) => { storeKey(k); setStaffKey(k) }} />
  }

  return (
    <DaySchedule
      staffKey={staffKey}
      onSignOut={() => setStaffKey('')}
    />
  )
}
