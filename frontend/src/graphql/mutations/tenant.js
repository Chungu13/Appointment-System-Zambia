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

export const UPDATE_TENANT_PROFILE = gql`
  mutation UpdateTenantProfile($coverImageUrl: String, $address: String, $phone: String) {
    updateTenantProfile(coverImageUrl: $coverImageUrl, address: $address, phone: $phone)
  }
`

export const UPDATE_BUSINESS_POLICIES = gql`
  mutation UpdateBusinessPolicies($policies: BusinessPoliciesInput!) {
    updateBusinessPolicies(policies: $policies)
  }
`

export const COMPLETE_ONBOARDING = gql`
  mutation CompleteOnboarding {
    completeOnboarding
  }
`
