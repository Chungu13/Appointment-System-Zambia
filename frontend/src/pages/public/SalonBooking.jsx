import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { MessageCircle, X } from 'lucide-react'
import { playPopSound } from '../../lib/sounds'
import { SERVICES } from '../../graphql/queries/services'
import { CUSTOMER_APPOINTMENTS } from '../../graphql/queries/bookings'
import { SALON_PROFILE } from '../../graphql/queries/salons'
import { BookingProvider, useBooking } from '../../context/BookingContext'
import ServiceCard from '../../components/booking/ServiceCard'
import DatePicker from '../../components/booking/DatePicker'
import TimeSlotGrid from '../../components/booking/TimeSlotGrid'
import BookingSummary from '../../components/booking/BookingSummary'
import PaymentOptions from '../../components/booking/PaymentOptions'
import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ChatWindow from '../../components/chat/ChatWindow'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { useAvailability } from '../../hooks/useAvailability'
import { useBookingFlow } from '../../hooks/useBookingFlow'
import { toDateInputValue, formatDateTime, formatZMW } from '../../lib/utils'

const STEP_LABELS = ['Service', 'Date & Time', 'Your Details', 'Confirmed']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? 'bg-primary text-on-primary' :
                  active ? 'bg-primary text-on-primary ring-4 ring-primary/20' :
                  'bg-surface-container text-on-surface-variant'
                }`}
              >
                {done ? '✓' : step}
              </span>
              <span className={`text-xs hidden sm:block ${active ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 transition-colors ${done ? 'bg-primary' : 'bg-outline-variant'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Choose service ───────────────────────────────────────────────────
function Step1Services() {
  const { dispatch } = useBooking()
  const { data, loading, error } = useQuery(SERVICES)

  if (loading) return <PageSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-on-surface mb-4">Choose a service</h2>
      {data?.services?.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onSelect={(s) => dispatch({ type: 'SELECT_SERVICE', payload: s })}
        />
      ))}
    </div>
  )
}


// ── Step 2: Date + time ──────────────────────────────────────────────────────
function Step2DateTime() {
  const { state, dispatch } = useBooking()
  const [date, setDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [selectedStaffId, setSelectedStaffId] = useState(state.preferredStaffId ?? null)
  const { slots, loading, error } = useAvailability(state.service?.id, date, selectedStaffId)
  const { data: profileData } = useQuery(SALON_PROFILE)
  const staffList = profileData?.salonProfile?.staff ?? []
  const staffCount = profileData?.salonProfile?.staffCount ?? 0

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-on-surface mb-4">Pick a date & time</h2>

      {/* Stylist selector — only shown when there are multiple bookable staff */}
      {staffCount > 1 && (
        <div className="mb-5">
          <p className="text-sm font-medium text-on-surface mb-2">Choose your stylist (optional)</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStaffId(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedStaffId === null
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Any stylist
            </button>
            {staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStaffId(selectedStaffId === s.id ? null : s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedStaffId === s.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {s.fullName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <DatePicker selected={date} onChange={setDate} minDate={(() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` })()} />
        <div>
          <p className="text-sm font-medium text-on-surface mb-3">Available slots</p>
          {loading && <PageSpinner />}
          {error && <ErrorMessage message={error.message} />}
          {!loading && !error && (
            <TimeSlotGrid
              slots={slots}
              selected={state.slot}
              onSelect={(slot) => dispatch({ type: 'SELECT_SLOT', payload: slot })}
              showStaffName={staffCount > 1 && !selectedStaffId}
            />
          )}

        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => dispatch({ type: 'PREV_STEP' })}>Back</Button>
      </div>
    </div>
  )
}

// ── Step 3: Customer details + payment method (if deposit required) ──────────
function Step3Details() {
  const { state, dispatch, submitBooking, loading, error } = useBookingFlow()
  const [form, setForm] = useState(state.customer)
  const [paymentMethod, setPaymentMethod] = useState('AIRTEL_MONEY')
  const needsDeposit = (state.service?.depositZmw ?? 0) > 0

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    dispatch({ type: 'SET_CUSTOMER', payload: { [key]: value } })
  }

  async function next() {
    await submitBooking(needsDeposit ? paymentMethod : 'AIRTEL_MONEY')
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-on-surface mb-4">Your details</h2>
      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Mwansa"
            required
          />
          <Input
            label="Phone number"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+260 97 123 4567"
            required
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any special requests…"
          />
          {needsDeposit && (
            <div>
              <p className="text-sm font-medium text-on-surface mb-3">How will you pay the deposit?</p>
              <PaymentOptions
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                amount={state.service.depositZmw}
              />
            </div>
          )}
        </div>
        <BookingSummary
          service={state.service}
          slot={state.slot}
          customer={form}
          depositRequired={state.service?.depositZmw ?? 0}
        />
      </div>
      {error && <ErrorMessage message={error.message} className="mb-4" />}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => dispatch({ type: 'PREV_STEP' })}>Back</Button>
        <Button
          loading={loading}
          disabled={!form.name || !form.phone || (needsDeposit && !paymentMethod)}
          onClick={next}
        >
          {needsDeposit ? 'Pay Deposit & Confirm' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  )
}

// ── Booking confirmation with past bookings ──────────────────────────────────
function BookingConfirmation({ phone, onReset }) {
  const { data, loading } = useQuery(CUSTOMER_APPOINTMENTS, {
    variables: { phone },
    skip: !phone,
  })

  const bookings = data?.customerAppointments ?? []
  const STATUS_COLOR = { confirmed: 'blue', completed: 'green', cancelled: 'red', pending: 'gray', in_progress: 'purple' }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="font-display text-2xl font-bold text-primary mb-2">You're booked!</h2>
        <p className="text-on-surface-variant mb-6">
          We'll send a reminder to <strong>{phone}</strong> before your appointment.
        </p>
        <Button onClick={onReset}>Book another</Button>
      </div>

      {(loading || bookings.length > 0) && (
        <div>
          <p className="text-sm font-medium text-on-surface mb-3">Your bookings</p>
          {loading && <PageSpinner />}
          <div className="space-y-2">
            {bookings.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between rounded-xl border border-outline-variant px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-on-surface">{appt.service.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatDateTime(appt.startsAt)} · {appt.staff.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">{formatZMW(appt.service.priceZmw)}</span>
                  <Badge color={STATUS_COLOR[appt.status] ?? 'gray'}>{appt.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 4: Booking confirmed (zero-deposit path only) ───────────────────────
function Step4Confirmed() {
  const { state, dispatch } = useBooking()
  return (
    <BookingConfirmation
      phone={state.customer.phone}
      onReset={() => dispatch({ type: 'RESET' })}
    />
  )
}

// ── Main booking page ────────────────────────────────────────────────────────
function BookingFlow() {
  const { state, dispatch } = useBooking()
  const { salonSlug } = useParams()
  const [searchParams] = useSearchParams()
  const [chatOpen, setChatOpen] = useState(false)
  const { data: profileData } = useQuery(SALON_PROFILE)

  useEffect(() => {
    const staffId = searchParams.get('staffId')
    if (staffId) dispatch({ type: 'SET_PREFERRED_STAFF', payload: parseInt(staffId) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-on-primary py-6">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-on-primary/70 text-sm mb-1 capitalize">{salonSlug?.replace(/-/g, ' ')}</p>
          <h1 className="font-display text-2xl font-bold">Book an Appointment</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <StepIndicator current={state.step} />
        {state.step === 1 && <Step1Services />}
        {state.step === 2 && <Step2DateTime />}
        {state.step === 3 && <Step3Details />}
        {state.step === 4 && <Step4Confirmed />}
      </main>

      {/* Chat FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {!chatOpen && (
          <span className="bg-white text-on-surface font-semibold text-sm px-3 py-1.5 rounded-full shadow-md select-none">
            Ask or Book
          </span>
        )}
        <div className="relative">
          {!chatOpen && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: '#6B2737' }}
            />
          )}
          <button
            onClick={() => { playPopSound(); setChatOpen((v) => !v) }}
            className="relative w-16 h-16 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
            style={{ background: '#4A1A25' }}
            title="Chat with booking assistant"
          >
            {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          </button>
        </div>
      </div>

      {chatOpen && (
        <ChatWindow
          customerPhone={state.customer.phone || '+260000000000'}
          salonName={profileData?.salonProfile?.businessName}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}

export default function SalonBooking() {
  return (
    <BookingProvider>
      <BookingFlow />
    </BookingProvider>
  )
}
