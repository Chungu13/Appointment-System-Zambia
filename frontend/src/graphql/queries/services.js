import { gql } from '@apollo/client'

export const SERVICES = gql`
  query Services($category: CategoryEnum, $activeOnly: Boolean) {
    services(category: $category, activeOnly: $activeOnly) {
      id
      name
      category
      description
      durationMinutes
      priceZmw
      depositZmw
      bufferMinutes
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
