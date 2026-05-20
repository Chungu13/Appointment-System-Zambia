import { useMutation } from '@apollo/client/react'
import { useBooking } from '../context/BookingContext'
import { CREATE_BOOKING } from '../graphql/mutations/bookings'

export function useBookingFlow() {
  const { state, dispatch } = useBooking()
  const [createBookingMutation, { loading, error }] = useMutation(CREATE_BOOKING)

  async function submitBooking(paymentMethod = 'AIRTEL_MONEY') {
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
        paymentMethod,
      },
    })
    const result = data.createBooking

    // Deposit required → redirect to payment provider (user leaves the app)
    if (result.requiresPayment && result.paymentUrl) {
      window.location.href = result.paymentUrl
      return result
    }

    // Zero deposit → show confirmation inline
    dispatch({ type: 'SET_APPOINTMENT', payload: result })
    return result
  }

  return {
    state,
    dispatch,
    submitBooking,
    loading,
    error,
  }
}
