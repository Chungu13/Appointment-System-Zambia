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
    $startTime: Time
    $endTime: Time
  ) {
    setWorkingHours(
      staffId: $staffId
      dayOfWeek: $dayOfWeek
      isDayOff: $isDayOff
      startTime: $startTime
      endTime: $endTime
    ) {
      id
      dayOfWeek
      dayName
      startTime
      endTime
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
