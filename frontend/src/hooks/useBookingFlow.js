import { useMutation } from '@apollo/client/react'
import { useBooking } from '../context/BookingContext'
import { CREATE_BOOKING } from '../graphql/mutations/bookings'
import { INITIATE_PAYMENT } from '../graphql/mutations/payments'

export function useBookingFlow() {
  const { state, dispatch } = useBooking()
  const [createBookingMutation, { loading: bookingLoading, error: bookingError }] =
    useMutation(CREATE_BOOKING)
  const [initiatePaymentMutation, { loading: paymentLoading, error: paymentError }] =
    useMutation(INITIATE_PAYMENT)

  async function submitBooking() {
    const { service, slot, customer } = state
    const { data } = await createBookingMutation({
      variables: {
        serviceId: service.id,
        staffId: slot.staff.id,
        startsAt: slot.startsAt,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerNotes: customer.notes,
        bookedBy: 'CUSTOMER',
      },
    })
    dispatch({ type: 'SET_APPOINTMENT', payload: data.createBooking })
    return data.createBooking
  }

  async function submitPayment(paymentMethod) {
    const { appointment } = state
    const { data } = await initiatePaymentMutation({
      variables: {
        appointmentId: appointment.id,
        paymentMethod,
        paymentType: 'DEPOSIT',
      },
    })
    dispatch({ type: 'SET_PAYMENT', payload: data.initiatePayment })
    return data.initiatePayment
  }

  return {
    state,
    dispatch,
    submitBooking,
    submitPayment,
    loading: bookingLoading || paymentLoading,
    error: bookingError || paymentError,
  }
}
