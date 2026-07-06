import { gql } from '@apollo/client'

export const CREATE_SERVICE = gql`
  mutation CreateService(
    $name: String!
    $category: String!
    $durationMinutes: Int!
    $priceZmw: Float!
    $description: String
    $depositZmw: Float
    $bufferMinutes: Int
    $priceMaxZmw: Float
    $requiresReferencePicture: Boolean
  ) {
    createService(
      name: $name
      category: $category
      durationMinutes: $durationMinutes
      priceZmw: $priceZmw
      description: $description
      depositZmw: $depositZmw
      bufferMinutes: $bufferMinutes
      priceMaxZmw: $priceMaxZmw
      requiresReferencePicture: $requiresReferencePicture
    ) {
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
      isActive
    }
  }
`

export const UPDATE_SERVICE = gql`
  mutation UpdateService(
    $id: Int!
    $name: String
    $category: String
    $description: String
    $durationMinutes: Int
    $priceZmw: Float
    $depositZmw: Float
    $bufferMinutes: Int
    $priceMaxZmw: Float
    $requiresReferencePicture: Boolean
  ) {
    updateService(
      id: $id
      name: $name
      category: $category
      description: $description
      durationMinutes: $durationMinutes
      priceZmw: $priceZmw
      depositZmw: $depositZmw
      bufferMinutes: $bufferMinutes
      priceMaxZmw: $priceMaxZmw
      requiresReferencePicture: $requiresReferencePicture
    ) {
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
      isActive
    }
  }
`

export const TOGGLE_SERVICE = gql`
  mutation ToggleService($id: Int!) {
    toggleService(id: $id) {
      id
      isActive
    }
  }
`
