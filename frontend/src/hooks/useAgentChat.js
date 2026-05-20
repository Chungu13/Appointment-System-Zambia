import { useState, useCallback } from 'react'
import { useMutation } from '@apollo/client/react'
import { AGENT_CHAT } from '../graphql/mutations/agents'

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useAgentChat(customerPhone, salonName) {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState(() => {
    const name = salonName || 'us'
    return [
      {
        role: 'assistant',
        content: `Hi! 👋 Welcome to ${name}! I'm here to help you with anything — booking an appointment, checking our prices and availability, or answering any questions about our services. Just type what you need and I'll sort it out for you!`,
      },
    ]
  })
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
