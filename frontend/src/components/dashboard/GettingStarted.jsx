import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCheck, ChevronRight, Copy } from 'lucide-react'
import { SERVICES } from '../../graphql/queries/services'
import { STAFF_LIST } from '../../graphql/queries/staff'

const PRIMARY = '#6B2737'
const MUTED   = '#8B4A5A'
const BORDER  = '#D4B0B8'
const CREAM   = '#FDF5F6'

function getBookingUrl() {
  const { hostname, port } = window.location
  const parts = hostname.split('.')
  const slug =
    parts.length >= 3 ? parts[0] :
    parts.length === 2 && parts[1] === 'localhost' ? parts[0] :
    null
  if (!slug) return null
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
  return appDomain
    ? `https://${slug}.${appDomain}`
    : `http://${slug}.localhost:${port || '3000'}`
}

function Item({ isDone, label, sub, onClick, rightSlot }) {
  const clickable = !isDone || !!rightSlot
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
      style={{
        backgroundColor: isDone && !rightSlot ? '#f9fafb' : CREAM,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: isDone ? PRIMARY : 'transparent',
          border: isDone ? 'none' : `2px solid ${BORDER}`,
        }}
      >
        {isDone && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: isDone && !rightSlot ? MUTED : PRIMARY }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-xs truncate mt-0.5" style={{ color: MUTED }}>{sub}</p>
        )}
      </div>

      <div className="shrink-0">
        {rightSlot ?? (!isDone && <ChevronRight size={14} style={{ color: MUTED }} />)}
      </div>
    </button>
  )
}

export default function GettingStarted() {
  const navigate  = useNavigate()
  const [copied, setCopied]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const { data: servicesData } = useQuery(SERVICES)
  const { data: staffData }    = useQuery(STAFF_LIST)

  const services  = servicesData?.services  ?? []
  const staffList = staffData?.staffList     ?? []
  const bookingUrl = getBookingUrl()

  const hasService  = services.length > 0
  const hasStaff    = staffList.length > 0
  const hasAssigned = staffList.some(s => (s.assignedServiceIds?.length ?? 0) > 0)
  const hasHours    = staffList.some(s => s.workingHours?.some(wh => !wh.isDayOff))
  const hasLink     = !!bookingUrl

  const flags     = [hasService, hasStaff, hasAssigned, hasHours, hasLink]
  const doneCount = flags.filter(Boolean).length
  const allDone   = doneCount === flags.length

  function copyLink() {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (dismissed) return null

  if (allDone) {
    return (
      <div
        className="rounded-2xl px-5 py-3 mb-6 flex items-center justify-between"
        style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
      >
        <div className="flex items-center gap-2">
          <Check size={14} style={{ color: '#16a34a' }} />
          <span className="text-sm font-medium" style={{ color: '#15803d' }}>
            Setup complete — your business is ready to take bookings!
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm leading-none hover:opacity-60 transition-opacity ml-4"
          style={{ color: '#6b7280' }}
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      id="tour-checklist"
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
    >
      {/* Header + progress bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: PRIMARY }}>Getting Started</h2>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {doneCount} of {flags.length} complete
          </p>
        </div>
        <div
          className="w-24 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#f3f4f6' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / flags.length) * 100}%`, backgroundColor: PRIMARY }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Item
          isDone={hasService}
          label="Add your first service"
          sub="List what you offer with pricing and duration"
          onClick={() => navigate('/owner/services')}
        />
        <Item
          isDone={hasStaff}
          label="Add a team member"
          sub="Add yourself or your staff to enable bookings"
          onClick={() => navigate('/owner/staff')}
        />
        <Item
          isDone={hasAssigned}
          label="Assign services to your team"
          sub="Connect who does what so the booking system works"
          onClick={() => navigate('/owner/staff')}
        />
        <Item
          isDone={hasHours}
          label="Set your working hours"
          sub="Tell customers when you're available"
          onClick={() => navigate('/owner/staff')}
        />
        <Item
          isDone={hasLink}
          label="Share your booking link"
          sub={bookingUrl ?? 'Your booking page'}
          onClick={copyLink}
          rightSlot={
            copied
              ? <CheckCheck size={14} style={{ color: '#16a34a' }} />
              : <Copy size={14} style={{ color: MUTED }} />
          }
        />
      </div>
    </div>
  )
}
