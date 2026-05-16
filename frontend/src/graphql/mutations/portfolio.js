import { gql } from '@apollo/client'

export const ADD_PORTFOLIO_IMAGE = gql`
  mutation AddPortfolioImage($imageUrl: String!, $caption: String, $serviceId: Int) {
    addPortfolioImage(imageUrl: $imageUrl, caption: $caption, serviceId: $serviceId) {
      id
      imageUrl
      caption
      serviceId
      serviceName
      displayOrder
      isActive
    }
  }
`

export const DELETE_PORTFOLIO_IMAGE = gql`
  mutation DeletePortfolioImage($id: ID!) {
    deletePortfolioImage(id: $id)
  }
`

export const REORDER_PORTFOLIO_IMAGES = gql`
  mutation ReorderPortfolioImages($ids: [ID!]!) {
    reorderPortfolioImages(ids: $ids)
  }
`
