import { gql } from '@apollo/client'

export const CREATE_STAFF = gql`
  mutation CreateStaff(
    $fullName: String
    $phone: String
    $username: String
    $email: String
    $pin: String
    $isMe: Boolean
  ) {
    createStaff(
      fullName: $fullName
      phone: $phone
      username: $username
      email: $email
      pin: $pin
      isMe: $isMe
    ) {
      id
      fullName
      phone
      username
      role
      isAlsoStaff
      isActive
    }
  }
`

export const SET_STAFF_PIN = gql`
  mutation SetStaffPin($staffId: Int!, $pin: String!) {
    setStaffPin(staffId: $staffId, pin: $pin) {
      id
      fullName
    }
  }
`

export const SET_WORKING_HOURS = gql`
  mutation SetWorkingHours(
    $staffId: Int!
    $dayOfWeek: Int!
    $isDayOff: Boolean!
    $availableTimes: [String!]!
  ) {
    setWorkingHours(
      staffId: $staffId
      dayOfWeek: $dayOfWeek
      isDayOff: $isDayOff
      availableTimes: $availableTimes
    ) {
      id
      dayOfWeek
      dayName
      availableTimes
      isDayOff
    }
  }
`

export const ASSIGN_SERVICE = gql`
  mutation AssignService($staffId: Int!, $serviceId: Int!) {
    assignService(staffId: $staffId, serviceId: $serviceId)
  }
`

export const REMOVE_SERVICE = gql`
  mutation RemoveService($staffId: Int!, $serviceId: Int!) {
    removeService(staffId: $staffId, serviceId: $serviceId)
  }
`

export const UPDATE_MY_PROFILE = gql`
  mutation UpdateMyProfile($fullName: String, $phone: String, $avatarUrl: String) {
    updateMyProfile(fullName: $fullName, phone: $phone, avatarUrl: $avatarUrl) {
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

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`

export const UPDATE_STAFF_PROFILE = gql`
  mutation UpdateStaffProfile(
    $staffId: Int!
    $avatarUrl: String
    $bio: String
    $displayOnPublicPage: Boolean
  ) {
    updateStaffProfile(
      staffId: $staffId
      avatarUrl: $avatarUrl
      bio: $bio
      displayOnPublicPage: $displayOnPublicPage
    ) {
      id
      fullName
      avatarUrl
      bio
      displayOnPublicPage
    }
  }
`
