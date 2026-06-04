import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client/react'
import { AGENT_CHAT } from '../graphql/mutations/agents'

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useAgentChat(customerPhone, customerName, salonName, initialMessage, confirmedBooking) {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState(() => {
    const name = salonName || 'us'
    const msgs = [
      {
        role: 'assistant',
        content: `Hi${customerName ? `, ${customerName.split(' ')[0]}` : ''}! 👋 Welcome to ${name}! I can help you book an appointment, check our services and prices, or answer any questions. What can I help you with?`,
      },
    ]
    // Inject receipt directly as a structured message — never sent to the LLM
    if (confirmedBooking) {
      msgs.push({ role: 'assistant', type: 'receipt', booking: confirmedBooking })
    }
    return msgs
  })
  const [chatMutation, { loading }] = useMutation(AGENT_CHAT)

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return
      const userMsg = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])

      try {
        const { data } = await chatMutation({
          variables: { message: text, customerPhone, sessionId, customerName: customerName || '' },
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

  const sentRef = useRef(false)
  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true
      sendMessage(initialMessage)
    }
  }, [sendMessage, initialMessage])

  return { messages, sendMessage, loading, sessionId }
}
