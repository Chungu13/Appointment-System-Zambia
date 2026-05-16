import { gql } from '@apollo/client'

export const PORTFOLIO_IMAGES = gql`
  query PortfolioImages {
    portfolioImages {
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
