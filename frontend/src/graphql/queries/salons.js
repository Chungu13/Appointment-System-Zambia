import { gql } from '@apollo/client'

export const SALON_PROFILE = gql`
  query SalonProfile {
    salonProfile {
      businessName
      businessType
      phone
      city
      address
      services {
        id
        name
        category
        description
        durationMinutes
        priceZmw
        depositZmw
        isActive
      }
      openingHours {
        dayOfWeek
        dayName
        opensAt
        closesAt
        isClosed
      }
    }
  }
`

export const ALL_SALONS = gql`
  query AllSalons($city: String, $businessType: String) {
    salons(city: $city, businessType: $businessType) {
      id
      businessName
      businessType
      subdomain
      phone
      city
      address
      isActive
    }
  }
`
