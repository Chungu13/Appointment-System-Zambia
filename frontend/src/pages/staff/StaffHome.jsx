import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { MY_APPOINTMENTS } from '../../graphql/queries/bookings'
import { MY_PROFILE } from '../../graphql/queries/staff'
import { UPDATE_APPOINTMENT_STATUS } from '../../graphql/mutations/bookings'
import { useAuth } from '../../context/AuthContext'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import AppointmentCard from '../../components/staff/AppointmentCard'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { toDateInputValue } from '../../lib/utils'

export default function StaffHome() {
  const { setProfile } = useAuth()
  const today = toDateInputValue()

  useQuery(MY_PROFILE, {
    onCompleted: (d) => setProfile(d.myProfile),
  })

  const { data, loading, error, refetch } = useQuery(MY_APPOINTMENTS, {
    variables: { dateFrom: today, dateTo: today },
    fetchPolicy: 'network-only',
  })

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
    onCompleted: () => refetch(),
  })

  const appointments = data?.myAppointments ?? []
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  return (
    <PageWrapper maxWidth="3xl">
      <PageHeader title="Today's Schedule" subtitle={new Date().toLocaleDateString('en-ZM', { weekday: 'long', month: 'long', day: 'numeric' })} />

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ['confirmed', 'blue'],
          ['in_progress', 'purple'],
          ['completed', 'green'],
          ['cancelled', 'red'],
        ].map(([status, color]) => counts[status] ? (
          <Badge key={status} color={color}>
            {counts[status]} {status.replace('_', ' ')}
          </Badge>
        ) : null)}
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && appointments.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-16">No appointments today.</p>
      )}

      <div className="space-y-3">
        {appointments
          .filter((a) => !['completed', 'cancelled', 'no_show'].includes(a.status))
          .map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              loading={updating}
              onStatusChange={(id, status) =>
                updateStatus({ variables: { appointmentId: id, status } })
              }
            />
          ))}

        {appointments.some((a) => ['completed', 'cancelled', 'no_show'].includes(a.status)) && (
          <>
            <p className="text-xs font-medium text-on-surface-variant mt-6 mb-2">Done</p>
            {appointments
              .filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status))
              .map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} loading={false} onStatusChange={() => {}} />
              ))}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
