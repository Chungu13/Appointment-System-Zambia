import { gql } from '@apollo/client'

export const AGENT_CHAT = gql`
  mutation AgentChat($message: String!, $customerPhone: String!, $sessionId: String!) {
    agentChat(message: $message, customerPhone: $customerPhone, sessionId: $sessionId) {
      response
      sessionId
    }
  }
`
