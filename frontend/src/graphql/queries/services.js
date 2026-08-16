import { gql } from '@apollo/client'

export const SERVICES = gql`
  query Services($category: String, $activeOnly: Boolean) {
    services(category: $category, activeOnly: $activeOnly) {
      id
      name
      category
      description
      durationMinutes
      priceZmw
      priceMaxZmw
      depositZmw
      bufferMinutes
      requiresReferencePicture
      imageUrl
      isActive
    }
  }
`

export const AVAILABILITY = gql`
  query Availability($serviceId: Int!, $date: Date!, $staffId: Int) {
    availability(serviceId: $serviceId, date: $date, staffId: $staffId) {
      startsAt
      endsAt
      staff {
        id
        fullName
        avatarUrl
      }
    }
  }
`
