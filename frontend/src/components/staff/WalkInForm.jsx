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

  const selectStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
    border: '1.5px solid #C9B49C', borderRadius: 10, fontSize: 13,
    color: '#241812', backgroundColor: '#fff', outline: 'none',
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <ErrorMessage message={error.message} />}
      <Input label="Customer name" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} required />
      <Input label="Phone number" value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="+260..." required />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#5C4C3D' }}>Service</label>
        <select value={form.serviceId} onChange={(e) => set('serviceId', e.target.value)} required style={selectStyle}
          onFocus={(e) => (e.target.style.borderColor = '#3B2A1E')}
          onBlur={(e) => (e.target.style.borderColor = '#EDE3D6')}
        >
          <option value="">Select a service…</option>
          {servicesData?.services?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#5C4C3D' }}>Staff</label>
        <select value={form.staffId} onChange={(e) => set('staffId', e.target.value)} required style={selectStyle}
          onFocus={(e) => (e.target.style.borderColor = '#3B2A1E')}
          onBlur={(e) => (e.target.style.borderColor = '#EDE3D6')}
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
