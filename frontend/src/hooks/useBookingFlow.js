import { useBooking } from '../context/BookingContext'
import { useBookingSubmit } from './useBookingSubmit'

/**
 * Page-flow wrapper around useBookingSubmit — feeds it the reducer state and
 * advances the reducer on success. The actual create/payment handling lives in
 * useBookingSubmit so the wizard panel shares it.
 */
export function useBookingFlow() {
  const { state, dispatch } = useBooking()
  const { submit, loading, error } = useBookingSubmit()

  async function submitBooking(paymentMethod = 'AIRTEL_MONEY') {
    const result = await submit({
      service: state.service,
      slot: state.slot,
      customer: state.customer,
      paymentMethod,
    })

    // Redirected to the payment provider — nothing left to render.
    if (result.redirected) return result

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
