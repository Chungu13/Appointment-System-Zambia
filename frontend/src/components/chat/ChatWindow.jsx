import { useEffect, useRef } from 'react'
import { Bot, X } from 'lucide-react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { useAgentChat } from '../../hooks/useAgentChat'

export default function ChatWindow({ customerPhone, onClose }) {
  const { messages, sendMessage, loading } = useAgentChat(customerPhone)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl flex flex-col overflow-hidden max-h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary">
        <Bot size={18} />
        <div className="flex-1">
          <p className="font-medium text-sm">Booking Assistant</p>
          <p className="text-xs opacity-80">AI-powered · Usually replies instantly</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} loading={loading} />
    </div>
  )
}
