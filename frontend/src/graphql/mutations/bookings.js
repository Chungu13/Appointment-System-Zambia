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
  ) {
    createBooking(
      serviceId: $serviceId
      staffId: $staffId
      startsAt: $startsAt
      customerName: $customerName
      customerPhone: $customerPhone
      bookedBy: $bookedBy
      customerNotes: $customerNotes
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

export const ADD_TO_WAITLIST = gql`
  mutation AddToWaitlist(
    $serviceId: Int!
    $customerName: String!
    $customerPhone: String!
    $preferredDate: Date!
    $preferredStaffId: Int
  ) {
    addToWaitlist(
      serviceId: $serviceId
      customerName: $customerName
      customerPhone: $customerPhone
      preferredDate: $preferredDate
      preferredStaffId: $preferredStaffId
    ) {
      id
      preferredDate
      isActive
      customer { id fullName phone }
      service { id name }
    }
  }
`
