import { gql } from '@apollo/client'

export const CONFIRM_DUMMY_PAYMENT = gql`
  mutation ConfirmDummyPayment($paymentRef: String!) {
    confirmDummyPayment(paymentRef: $paymentRef) {
      success
      appointmentId
      serviceName
      startsAt
      staffName
    }
  }
`

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
