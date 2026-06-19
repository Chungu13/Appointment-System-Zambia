import { gql } from '@apollo/client'

export const SALON_PROFILE = gql`
  query SalonProfile {
    salonProfile {
      businessName
      businessType
      phone
      city
      area
      address
      coverImageUrl
      portfolioPreviewUrl
      staffCount
      staff {
        id
        fullName
        avatarUrl
        bio
        displayOnPublicPage
        serviceNames
      }
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
      portfolioImages {
        id
        imageUrl
        caption
        serviceName
        displayOrder
      }
      onboardingCompleted
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
      area
      address
      isActive
      isApproved
      coverImageUrl
      portfolioPreviewUrl
    }
  }
`
