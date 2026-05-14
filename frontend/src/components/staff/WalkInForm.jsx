import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { SERVICES } from '../../graphql/queries/services'
import { STAFF_LIST } from '../../graphql/queries/staff'
import { CREATE_BOOKING } from '../../graphql/mutations/bookings'
import Input, { Textarea } from '../ui/Input'
import Button from '../ui/Button'
import { ErrorMessage } from '../ui/Spinner'

export default function WalkInForm({ onSuccess }) {
  const [form, setForm] = useState({
    customerName: '', customerPhone: '',
    serviceId: '', staffId: '', notes: '',
  })
  const [success, setSuccess] = useState(false)

  const { data: servicesData } = useQuery(SERVICES)
  const { data: staffData } = useQuery(STAFF_LIST)
  const [createBooking, { loading, error }] = useMutation(CREATE_BOOKING)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    const now = new Date().toISOString()
    await createBooking({
      variables: {
        serviceId: Number(form.serviceId),
        staffId: Number(form.staffId),
        startsAt: now,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerNotes: form.notes,
        bookedBy: 'STAFF',
      },
    })
    setSuccess(true)
    setForm({ customerName: '', customerPhone: '', serviceId: '', staffId: '', notes: '' })
    onSuccess?.()
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-on-surface">Walk-in booked!</p>
        <Button className="mt-4" onClick={() => setSuccess(false)}>Book another</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorMessage message={error.message} />}
      <Input label="Customer name" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} required />
      <Input label="Phone number" value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="+260..." required />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-on-surface-variant">Service</label>
        <select
          value={form.serviceId}
          onChange={(e) => set('serviceId', e.target.value)}
          required
          className="w-full rounded-xl border border-outline-variant px-3 py-2.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select a service…</option>
          {servicesData?.services?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-on-surface-variant">Staff</label>
        <select
          value={form.staffId}
          onChange={(e) => set('staffId', e.target.value)}
          required
          className="w-full rounded-xl border border-outline-variant px-3 py-2.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select staff…</option>
          {staffData?.staffList?.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>
      </div>
      <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      <Button type="submit" fullWidth loading={loading}>Book Walk-in</Button>
    </form>
  )
}
