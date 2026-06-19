import { gql } from '@apollo/client'

export const SALON_SETTINGS = gql`
  query SalonSettings {
    salonSettings {
      businessName
      businessType
      city
      area
      address
      phone
      payoutPhone
      payoutNetwork
      whatsappNumber
      staffAccessKey
      coverImageUrl
      onboardingCompleted
      businessPolicies {
        cancellationPolicy
        lateArrivalPolicy
        lateFee
        waitingTime
        whatToBring
        parking
        contactPreference
        additionalInfo
      }
    }
  }
`

export const ALL_APPOINTMENTS_TODAY = gql`
  query AllAppointmentsToday($key: String!, $date: Date) {
    allAppointmentsToday(key: $key, date: $date) {
      id
      startsAt
      endsAt
      status
      staffName
      customerName
      serviceName
      serviceDuration
    }
  }
`
