import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client/react'
import { AGENT_CHAT } from '../graphql/mutations/agents'

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getStreamUrl() {
  const RESERVED = new Set(['www', 'api', 'app', 'admin', 'mail', 'smtp', 'ftp', 'cdn'])
  const parts = window.location.hostname.split('.')
  const sub =
    parts.length >= 3 ? parts[0] :
    parts.length === 2 && parts[1] === 'localhost' ? parts[0] :
    null
  const slug = sub && !RESERVED.has(sub) ? sub : null

  const apiDomain = import.meta.env.VITE_TENANT_API_DOMAIN
  if (slug) {
    return apiDomain
      ? `https://${slug}.${apiDomain}/chat/stream/`
      : `http://${slug}.localhost:8000/chat/stream/`
  }
  const base = (import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/').replace(/\/graphql\/?$/, '')
  return `${base}/chat/stream/`
}

export function useAgentChat(customerPhone, customerName, salonName, initialMessage, confirmedBooking, sessionToken) {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState(() => {
    const name = salonName || 'us'
    const msgs = [
      {
        role: 'assistant',
        content: `Hi${customerName ? `, ${customerName.split(' ')[0]}` : ''}! 👋 Welcome to ${name}! I can help you book an appointment, check our services and prices, or answer any questions. What can I help you with?`,
      },
    ]
    if (confirmedBooking) {
      msgs.push({ role: 'assistant', type: 'receipt', booking: confirmedBooking })
    }
    return msgs
  })
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [chatMutation] = useMutation(AGENT_CHAT)
  const streamUrl = useRef(getStreamUrl()).current

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading || limitReached) return

      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setLoading(true)

      // Optimistically add a streaming placeholder bubble
      setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

      let streamedOk = false
      try {
        const res = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            session_id: sessionId,
            session_token: sessionToken || '',
            customer_phone: customerPhone || '',
            customer_name: customerName || '',
          }),
        })

        // Handle session / message-cap errors inline — don't fall back to GraphQL
        if (res.status === 403 || res.status === 400) {
          let errMsg = res.status === 403
            ? 'Session expired. Please refresh to start a new conversation.'
            : 'Invalid message.'
          try {
            const errData = await res.json()
            if (errData.error) errMsg = errData.error
          } catch { /* ignore */ }

          setMessages((prev) => {
            const next = prev.filter((m, i, arr) => !(i === arr.length - 1 && m.streaming))
            return [...next, { role: 'assistant', content: errMsg }]
          })

          if (errMsg.toLowerCase().includes('message limit')) {
            setLimitReached(true)
          }
          return
        }

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            let parsed
            try { parsed = JSON.parse(line.slice(6)) } catch { continue }

            if (parsed.error) throw new Error(parsed.error)

            if (parsed.token) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.streaming) {
                  next[next.length - 1] = { ...last, content: last.content + parsed.token }
                }
                return next
              })
            }

            if (parsed.done) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.streaming) {
                  next[next.length - 1] = { role: 'assistant', content: last.content }
                }
                return next
              })
              streamedOk = true
            }
          }
        }

        if (!streamedOk) throw new Error('Stream ended without done signal')
      } catch (streamErr) {
        console.warn('SSE stream failed, falling back to GraphQL:', streamErr)

        // Remove streaming placeholder before fallback
        setMessages((prev) =>
          prev.filter((m, i, arr) => !(i === arr.length - 1 && m.streaming)),
        )

        try {
          const { data } = await chatMutation({
            variables: {
              message: text,
              customerPhone: customerPhone || '',
              sessionId,
              customerName: customerName || '',
            },
          })
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.agentChat.response },
          ])
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
          ])
        }
      } finally {
        setLoading(false)
      }
    },
    [chatMutation, customerPhone, customerName, sessionId, streamUrl, loading, limitReached, sessionToken],
  )

  const sentRef = useRef(false)
  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true
      sendMessage(initialMessage)
    }
  }, [sendMessage, initialMessage])

  return { messages, sendMessage, loading, sessionId, limitReached }
}
