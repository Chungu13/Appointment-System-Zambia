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
  if (!appt) return <p className="text-center py-16 text-on-surface-variant">Appointment not found.</p>

  return (
    <PageWrapper maxWidth="2xl">
      <PageHeader
        title="Appointment"
        subtitle={formatDateTime(appt.startsAt)}
        action={<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>}
      />

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={appt.customer.fullName} size="lg" />
            <div>
              <p className="font-semibold text-on-surface">{appt.customer.fullName}</p>
              <p className="text-sm text-on-surface-variant">{appt.customer.phone}</p>
              <div className="flex gap-2 mt-1">
                {appt.customer.noShowCount > 0 && (
                  <Badge color="yellow">{appt.customer.noShowCount} no-shows</Badge>
                )}
                <Badge color="gray">{appt.customer.visitCount} visits</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-on-surface-variant">Service</p><p className="font-medium text-on-surface">{appt.service.name}</p></div>
            <div><p className="text-on-surface-variant">Duration</p><p className="font-medium text-on-surface">{appt.service.durationMinutes} min</p></div>
            <div><p className="text-on-surface-variant">Price</p><p className="font-medium text-on-surface">{formatZMW(appt.service.priceZmw)}</p></div>
            <div><p className="text-on-surface-variant">Status</p><Badge status={appt.status} /></div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          {appt.status === 'confirmed' && (
            <Button
              loading={updatingStatus}
              onClick={() => updateStatus({ variables: { appointmentId: appt.id, status: 'IN_PROGRESS' } })}
            >
              Start appointment
            </Button>
          )}
          {appt.status === 'in_progress' && (
            <Button
              loading={updatingStatus}
              onClick={() => updateStatus({ variables: { appointmentId: appt.id, status: 'COMPLETED' } })}
            >
              Mark complete
            </Button>
          )}
          {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
            <Button
              variant="danger"
              loading={cancelling}
              onClick={() => cancelBooking({ variables: { appointmentId: appt.id, cancelledBy: 'staff' } })}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
