import { useState, useCallback } from 'react'
import { useMutation } from '@apollo/client/react'
import { AGENT_CHAT } from '../graphql/mutations/agents'

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useAgentChat(customerPhone) {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your booking assistant. How can I help you today?",
    },
  ])
  const [chatMutation, { loading }] = useMutation(AGENT_CHAT)

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return
      const userMsg = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])

      try {
        const { data } = await chatMutation({
          variables: { message: text, customerPhone, sessionId },
        })
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.agentChat.response },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          },
        ])
      }
    },
    [chatMutation, customerPhone, sessionId]
  )

  return { messages, sendMessage, loading, sessionId }
}
