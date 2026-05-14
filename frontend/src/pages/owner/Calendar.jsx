import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { MY_APPOINTMENTS } from '../../graphql/queries/bookings'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import AppointmentCard from '../../components/staff/AppointmentCard'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { toDateInputValue } from '../../lib/utils'
import { useMutation } from '@apollo/client/react'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'

export default function Calendar() {
  const [date, setDate] = useState(toDateInputValue())
  const { data, loading, error, refetch } = useQuery(MY_APPOINTMENTS, {
    variables: { dateFrom: date, dateTo: date },
    fetchPolicy: 'network-only',
  })
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => refetch(),
  })

  const appointments = data?.myAppointments ?? []

  return (
    <PageWrapper>
      <PageHeader
        title="Calendar"
        subtitle="All appointments"
        action={
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        }
      />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && appointments.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-16">No appointments on this date.</p>
      )}

      <div className="space-y-3">
        {appointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            loading={updating}
            onStatusChange={(id, status) =>
              updateStatus({ variables: { appointmentId: id, status } })
            }
          />
        ))}
      </div>
    </PageWrapper>
  )
}
