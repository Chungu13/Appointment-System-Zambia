import { gql } from '@apollo/client'

export const REGISTER_TENANT = gql`
  mutation RegisterTenant(
    $businessName: String!
    $businessType: String!
    $city: String!
    $ownerName: String!
    $phone: String!
    $email: String!
    $password: String!
    $address: String
  ) {
    registerTenant(
      businessName: $businessName
      businessType: $businessType
      city: $city
      ownerName: $ownerName
      phone: $phone
      email: $email
      password: $password
      address: $address
    ) {
      accessToken
      refreshToken
      tenantSubdomain
      staffAccessKey
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
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
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
