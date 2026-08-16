import { useMutation } from '@apollo/client/react'
import { CREATE_BOOKING } from '../graphql/mutations/bookings'

/**
 * The single place a customer booking is created.
 *
 * Both front doors use this — the wizard panel on the storefront and the
 * full-page flow at /book — so payment redirect behaviour can never drift
 * between them.
 *
 * Deposit bookings hand off to the payment provider (the customer leaves the
 * app); zero-deposit bookings return so the caller can confirm inline.
 */
export function useBookingSubmit() {
  const [createBooking, { loading, error }] = useMutation(CREATE_BOOKING)

  async function submit({ service, slot, customer, paymentMethod = 'AIRTEL_MONEY' }) {
    const { data } = await createBooking({
      variables: {
        serviceId: service.id,
        staffId: slot.staff.id,
        startsAt: slot.startsAt,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerNotes: customer.notes ?? '',
        bookedBy: 'CUSTOMER',
        paymentMethod,
      },
    })
    const result = data.createBooking

    if (result.requiresPayment && result.paymentUrl) {
      window.location.href = result.paymentUrl
      return { ...result, redirected: true }
    }
    return { ...result, redirected: false }
  }

  return { submit, loading, error }
}
