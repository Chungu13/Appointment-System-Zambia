import { useState } from 'react'
import { X } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { AGENT_ACTIVITY } from '../../graphql/queries/bookings'
import { toDateInputValue } from '../../lib/utils'

const BURG   = '#6B2737'
const TEXT   = '#1a0a0d'
const MUTED  = '#4a1527'
const HINT   = '#8a6268'
const BORDER = '#ede5e7'
const sans   = "'Inter', sans-serif"

const ACTION_MAP = {
  get_unpaid_bookings:        'Checked for unpaid deposits',
  get_services:               'Looked up available services',
  check_availability:         'Checked calendar availability',
  create_booking:             'Created a new booking',
  send_payment_reminder:      'Sent payment reminder to customer',
  cancel_unpaid_booking:      'Cancelled unpaid booking and freed slot',
  notify_customer:            'Notified waitlist customer about opening',
  mark_no_show:               'Marked appointment as no-show',
  send_appointment_reminders: 'Sent appointment reminders',
  get_waitlist_matches:       'Checked waitlist for matching customers',
  get_cancelled_slot:         'Found cancelled appointment slot',
  get_weekly_stats:           'Analysed weekly business data',
  get_slow_slots:             'Identified slow booking periods',
  get_lapsed_customers:       'Found customers who need re-engagement',
  get_booking:                'Retrieved booking details',
  cancel_booking:             'Cancelled an appointment',
  get_staff:                  'Looked up staff members',
  add_to_waitlist:            'Added customer to waitlist',
  initiate_payment:           'Initiated payment process',
  confirm_payment:            'Confirmed payment received',
  process_refund:             'Processed a refund',
  get_payment_status:         'Checked payment status',
  get_todays_appointments:    "Checked today's schedule",
  get_upcoming_appointments:  'Checked upcoming appointments',
  get_best_staff:             'Assigned best available staff',
  get_addons:                 'Checked available add-ons',
  find_my_appointments:       'Looked up customer appointments',
  cancel_appointment:         'Cancelled an appointment',
  retry_payment:              'Retried a payment',
}

function humanizeAction(action) {
  if (!action) return action
  const cleaned = action.replace(/^Tool call:\s*/i, '').trim()
  return ACTION_MAP[cleaned] ?? cleaned.replace(/_/g, ' ')
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function outcomeColor(outcome) {
  if (outcome === 'success')       return '#16a34a'
  if (outcome === 'failed')        return '#dc2626'
  if (outcome === 'pending_human') return '#d97706'
  return HINT
}

function LogRow({ log }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `0.5px solid ${BORDER}` }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: outcomeColor(log.outcome), flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1.4 }}>
          {humanizeAction(log.action)}
        </p>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT, margin: '2px 0 0' }}>
          {timeAgo(log.createdAt)}
        </p>
      </div>
    </div>
  )
}

function AllActivityModal({ onClose }) {
  const { data, loading } = useQuery(AGENT_ACTIVITY, {
    variables: { limit: 200 },
    fetchPolicy: 'network-only',
  })
  const logs = data?.agentActivity ?? []

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: 0 }}>
            All AI Activity
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }}>
          {loading ? (
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, textAlign: 'center', padding: '32px 0' }}>Loading…</p>
          ) : logs.length === 0 ? (
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, textAlign: 'center', padding: '32px 0' }}>No activity yet.</p>
          ) : (
            logs.map((log) => <LogRow key={log.id} log={log} />)
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentFeed({ limit = 8 }) {
  const [showAll, setShowAll] = useState(false)
  const today = toDateInputValue()

  const { data, loading } = useQuery(AGENT_ACTIVITY, {
    variables: { limit, date: today },
    fetchPolicy: 'network-only',
  })
  const logs = data?.agentActivity ?? []

  return (
    <>
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: 0 }}>
            AI Activity
          </p>
          {logs.length > 0 && (
            <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: HINT }}>
              {logs.length} today
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, textAlign: 'center', padding: '20px 0' }}>Loading…</p>
        ) : logs.length === 0 ? (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, textAlign: 'center', padding: '20px 0' }}>
            No activity today. Agents are standing by.
          </p>
        ) : (
          <div>
            {logs.map((log) => <LogRow key={log.id} log={log} />)}
          </div>
        )}

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${BORDER}` }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              fontFamily: sans, fontSize: 10, fontWeight: 300,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: BURG, background: 'none', border: 'none',
              cursor: 'pointer', width: '100%', textAlign: 'center',
              padding: 0,
            }}
          >
            View all activity →
          </button>
        </div>
      </div>

      {showAll && <AllActivityModal onClose={() => setShowAll(false)} />}
    </>
  )
}
