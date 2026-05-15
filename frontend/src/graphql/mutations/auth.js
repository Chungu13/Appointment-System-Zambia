import { gql } from '@apollo/client'

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
