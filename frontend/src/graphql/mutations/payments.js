import { gql } from '@apollo/client'

export const INITIATE_PAYMENT = gql`
  mutation InitiatePayment(
    $appointmentId: Int!
    $phone: String!
    $paymentType: PaymentTypeEnum
  ) {
    initiatePayment(
      appointmentId: $appointmentId
      phone: $phone
      paymentType: $paymentType
    ) {
      success
      reference
      message
      instantConfirm
    }
  }
`
