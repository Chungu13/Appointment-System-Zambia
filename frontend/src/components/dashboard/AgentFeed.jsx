import { Calendar, CreditCard, Clock, BarChart2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { AGENT_ACTIVITY } from '../../graphql/queries/bookings'
import { PageSpinner, ErrorMessage } from '../ui/Spinner'

const TYPE_CONFIG = {
  booking:    { icon: Calendar,    color: '#16a34a', bg: '#dcfce7', label: 'Booking'    },
  payment:    { icon: CreditCard,  color: '#2563eb', bg: '#dbeafe', label: 'Payment'    },
  scheduling: { icon: Clock,       color: '#7c3aed', bg: '#ede9fe', label: 'Schedule'   },
  insights:   { icon: BarChart2,   color: '#d97706', bg: '#fef3c7', label: 'Insights'   },
}

const OUTCOME_ICON = {
  success:       <CheckCircle  size={12} style={{ color: '#16a34a' }} />,
  failed:        <XCircle      size={12} style={{ color: '#dc2626' }} />,
  pending_human: <AlertCircle  size={12} style={{ color: '#d97706' }} />,
}

const ACTION_MAP = {
  get_unpaid_bookings:       'Checked for unpaid deposits',
  get_services:              'Looked up available services',
  check_availability:        'Checked calendar availability',
  create_booking:            'Created a new booking',
  send_payment_reminder:     'Sent payment reminder to customer',
  cancel_unpaid_booking:     'Cancelled unpaid booking and freed slot',
  notify_customer:           'Notified waitlist customer about opening',
  mark_no_show:              'Marked appointment as no-show',
  send_appointment_reminders:'Sent appointment reminders',
  get_waitlist_matches:      'Checked waitlist for matching customers',
  get_cancelled_slot:        'Found cancelled appointment slot',
  get_weekly_stats:          'Analysed weekly business data',
  get_slow_slots:            'Identified slow booking periods',
  get_lapsed_customers:      'Found customers who need re-engagement',
  get_booking:               'Retrieved booking details',
  cancel_booking:            'Cancelled an appointment',
  reschedule_booking:        'Rescheduled an appointment',
  get_staff:                 'Looked up staff members',
  add_to_waitlist:           'Added customer to waitlist',
  initiate_payment:          'Initiated payment process',
  confirm_payment:           'Confirmed payment received',
  process_refund:            'Processed a refund',
  get_payment_status:        'Checked payment status',
  get_todays_appointments:   "Checked today's schedule",
  get_upcoming_appointments: 'Checked upcoming appointments',
  get_revenue_stats:         'Analysed revenue statistics',
  get_booking_stats:         'Analysed booking trends',
  get_customer_stats:        'Reviewed customer activity',
  get_top_services:          'Identified top-performing services',
  generate_campaign:         'Generated a marketing campaign suggestion',
}

function humanizeAction(action) {
  if (!action) return action
  const cleaned = action.replace(/^Tool call:\s*/i, '').trim()
  return ACTION_MAP[cleaned] ?? cleaned.replace(/_/g, ' ')
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60)   return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export default function AgentFeed({ limit = 10 }) {
  const { data, loading, error } = useQuery(AGENT_ACTIVITY, { variables: { limit } })
  const logs = data?.agentActivity ?? []

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: '#ffffff', border: '1px solid #D4B0B8' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: '#4A1A25' }}>AI Activity</h3>
        {logs.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#E8C4CC', color: '#4A1A25' }}>
            {logs.length} recent
          </span>
        )}
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && !error && logs.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: '#8B4A5A' }}>
          No activity yet — agents are standing by.
        </p>
      )}

      <div className="space-y-3">
        {logs.map((log) => {
          const cfg = TYPE_CONFIG[log.agentType] ?? TYPE_CONFIG.scheduling
          const Icon = cfg.icon
          return (
            <div key={log.id} className="flex items-start gap-3">
              {/* Type icon */}
              <div
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon size={14} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: '#1a1a1a' }}>{humanizeAction(log.action)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {OUTCOME_ICON[log.outcome]}
                  <span className="text-xs" style={{ color: '#8B4A5A' }}>{timeAgo(log.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {logs.length >= limit && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #D4B0B8' }}>
          <button
            className="text-xs font-medium w-full text-center transition-colors hover:opacity-70"
            style={{ color: '#6B2737' }}
          >
            View all activity →
          </button>
        </div>
      )}
    </div>
  )
}
