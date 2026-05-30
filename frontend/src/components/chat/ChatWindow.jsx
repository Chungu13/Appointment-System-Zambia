import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { useAgentChat } from '../../hooks/useAgentChat'
import { playPopSound, playDingSound } from '../../lib/sounds'

export default function ChatWindow({ customerPhone, onClose, salonName, initialMessage }) {
  const { messages, sendMessage, loading } = useAgentChat(customerPhone, salonName, initialMessage)
  const bottomRef = useRef(null)
  const prevCountRef = useRef(messages.length)

  // Play pop when chat first opens
  useEffect(() => {
    playPopSound()
  }, [])

  // Play ding when a new agent message arrives
  useEffect(() => {
    const prev = prevCountRef.current
    const curr = messages.length
    if (curr > prev && messages[curr - 1]?.role === 'assistant') {
      playDingSound()
    }
    prevCountRef.current = curr
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div
      className="animate-chat-slide-up fixed bottom-4 right-4 z-50 w-80 sm:w-[420px] flex flex-col overflow-hidden"
      style={{
        maxHeight: '600px',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: '#4A1A25' }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white font-bold text-base select-none">
          {(salonName || 'B')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">
            {salonName || 'Booking Assistant'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <p className="text-xs text-white/75">Online</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors shrink-0 text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ background: '#FDF5F6' }}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start animate-chat-fade-in">
            <div
              className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: '#ffffff', borderLeft: '3px solid #6B2737' }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#6B2737', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} loading={loading} />
    </div>
  )
}
