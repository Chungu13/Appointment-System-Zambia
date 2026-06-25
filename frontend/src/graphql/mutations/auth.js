import { gql } from '@apollo/client'

export const REGISTER_TENANT = gql`
  mutation RegisterTenant(
    $businessName: String!
    $businessType: String!
    $city: String!
    $area: String
    $ownerName: String!
    $phone: String!
    $email: String!
    $address: String
    $password: String
    $googleToken: String
    $honeypot: String
    $turnstileToken: String
  ) {
    registerTenant(
      businessName: $businessName
      businessType: $businessType
      city: $city
      area: $area
      ownerName: $ownerName
      phone: $phone
      email: $email
      address: $address
      password: $password
      googleToken: $googleToken
      honeypot: $honeypot
      turnstileToken: $turnstileToken
    ) {
      message
    }
  }
`


export const LOGIN_WITH_PIN = gql`
  mutation LoginWithPin($phone: String!, $pin: String!) {
    loginWithPin(phone: $phone, pin: $pin) {
      accessToken
      refreshToken
      user {
        id
        username
        fullName
        role
        avatarUrl
      }
    }
  }
`

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        username
        fullName
        role
        avatarUrl
      }
    }
  }
`

export const OWNER_LOGIN = gql`
  mutation OwnerLogin($email: String!, $password: String, $googleToken: String) {
    ownerLogin(email: $email, password: $password, googleToken: $googleToken) {
      accessToken
      refreshToken
      tenantSlug
      fullName
      isApproved
      businessName
    }
  }
`

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        username
        fullName
        role
      }
    }
  }
`
