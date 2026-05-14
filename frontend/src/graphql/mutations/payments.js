import { gql } from '@apollo/client'

export const INITIATE_PAYMENT = gql`
  mutation InitiatePayment(
    $appointmentId: Int!
    $paymentMethod: PaymentMethodEnum!
    $paymentType: PaymentTypeEnum
  ) {
    initiatePayment(
      appointmentId: $appointmentId
      paymentMethod: $paymentMethod
      paymentType: $paymentType
    ) {
      paymentId
      paymentUrl
      transactionRef
    }
  }
`
