import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { MY_APPOINTMENTS } from '../../graphql/queries/bookings'
import { UPDATE_APPOINTMENT_STATUS, CANCEL_BOOKING } from '../../graphql/mutations/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatDateTime, formatZMW } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(MY_APPOINTMENTS)
  const appt = data?.myAppointments?.find((a) => String(a.id) === id)

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_APPOINTMENT_STATUS)
  const [cancelBooking, { loading: cancelling }] = useMutation(CANCEL_BOOKING)

  if (loading) return <PageSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!appt) return <p style={{ textAlign: 'center', padding: '64px 0', color: '#6B4A50', fontSize: 14 }}>Appointment not found.</p>

  const lbl = { fontSize: 11, color: '#6B4A50', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const val = { fontSize: 13, fontWeight: 500, color: '#1A0A0D', margin: 0 }

  return (
    <PageWrapper maxWidth="2xl">
      <PageHeader
        title="Appointment"
        subtitle={formatDateTime(appt.startsAt)}
        action={<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <Avatar name={appt.customer.fullName} size="lg" />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1A0A0D', margin: '0 0 2px' }}>{appt.customer.fullName}</p>
              <p style={{ fontSize: 13, color: '#6B4A50', margin: '0 0 6px' }}>{appt.customer.phone}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {appt.customer.noShowCount > 0 && (
                  <Badge color="yellow">{appt.customer.noShowCount} no-shows</Badge>
                )}
                <Badge color="gray">{appt.customer.visitCount} visits</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><p style={lbl}>Service</p><p style={val}>{appt.service.name}</p></div>
            <div><p style={lbl}>Duration</p><p style={val}>{appt.service.durationMinutes} min</p></div>
            <div><p style={lbl}>Price</p><p style={val}>{formatZMW(appt.service.priceZmw)}</p></div>
            <div><p style={lbl}>Status</p><Badge status={appt.status} /></div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {appt.status === 'confirmed' && (
            <Button loading={updatingStatus} onClick={() => updateStatus({ variables: { appointmentId: appt.id, status: 'IN_PROGRESS' } })}>
              Start appointment
            </Button>
          )}
          {appt.status === 'in_progress' && (
            <Button loading={updatingStatus} onClick={() => updateStatus({ variables: { appointmentId: appt.id, status: 'COMPLETED' } })}>
              Mark complete
            </Button>
          )}
          {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
            <Button variant="danger" loading={cancelling} onClick={() => cancelBooking({ variables: { appointmentId: appt.id, cancelledBy: 'staff' } })}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
