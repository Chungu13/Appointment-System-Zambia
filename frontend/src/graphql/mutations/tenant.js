import { gql } from '@apollo/client'

export const VERIFY_STAFF_KEY = gql`
  mutation VerifyStaffKey($key: String!) {
    verifyStaffKey(key: $key)
  }
`

export const SET_STAFF_ACCESS_KEY = gql`
  mutation SetStaffAccessKey($key: String!) {
    setStaffAccessKey(key: $key)
  }
`

export const STAFF_UPDATE_APPOINTMENT = gql`
  mutation StaffUpdateAppointment($key: String!, $appointmentId: Int!, $status: String!) {
    staffUpdateAppointment(key: $key, appointmentId: $appointmentId, status: $status)
  }
`
