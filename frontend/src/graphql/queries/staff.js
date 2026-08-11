import { gql } from '@apollo/client'

export const MY_PROFILE = gql`
  query MyProfile {
    myProfile {
      id
      username
      fullName
      email
      phone
      role
      avatarUrl
      isActive
      isAlsoStaff
      dateJoined
    }
  }
`

export const PUBLIC_STAFF = gql`
  query PublicStaff {
    publicStaff {
      id
      fullName
      avatarUrl
    }
  }
`

export const STAFF_DAY_SLOTS = gql`
  query StaffDaySlots($staffId: Int!, $date: Date!) {
    staffDaySlots(staffId: $staffId, date: $date) {
      startsAt
      endsAt
      isBooked
    }
  }
`

export const STAFF_LIST = gql`
  query StaffList {
    staffList {
      id
      username
      fullName
      email
      phone
      role
      avatarUrl
      bio
      displayOnPublicPage
      isActive
      isAlsoStaff
      assignedServiceIds
      workingHours {
        id
        dayOfWeek
        dayName
        startTime
        endTime
        isDayOff
      }
    }
  }
`
