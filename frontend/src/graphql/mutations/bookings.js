import { gql } from '@apollo/client'

export const CREATE_BOOKING = gql`
  mutation CreateBooking(
    $serviceId: Int!
    $staffId: Int!
    $startsAt: DateTime!
    $customerName: String!
    $customerPhone: String!
    $bookedBy: BookedByEnum
    $customerNotes: String
    $paymentMethod: String
  ) {
    createBooking(
      serviceId: $serviceId
      staffId: $staffId
      startsAt: $startsAt
      customerName: $customerName
      customerPhone: $customerPhone
      bookedBy: $bookedBy
      customerNotes: $customerNotes
      paymentMethod: $paymentMethod
    ) {
      appointment {
        id
        status
        startsAt
        endsAt
        service { id name priceZmw depositZmw }
        staff { id fullName }
        customer { id fullName phone }
      }
      depositRequired
      requiresPayment
      paymentUrl
    }
  }
`

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($appointmentId: Int!, $reason: String, $cancelledBy: String) {
    cancelBooking(
      appointmentId: $appointmentId
      reason: $reason
      cancelledBy: $cancelledBy
    ) {
      appointment {
        id
        status
        cancellationReason
      }
      refundStatus
      message
    }
  }
`

export const REBOOK_APPOINTMENT = gql`
  mutation RebookAppointment($appointmentId: Int!, $newStartsAt: DateTime!) {
    rebookAppointment(appointmentId: $appointmentId, newStartsAt: $newStartsAt) {
      id
      status
      startsAt
      endsAt
    }
  }
`

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus(
    $appointmentId: Int!
    $status: BookingStatusEnum!
    $staffNotes: String
  ) {
    updateAppointmentStatus(
      appointmentId: $appointmentId
      status: $status
      staffNotes: $staffNotes
    ) {
      id
      status
      updatedAt
    }
  }
`

