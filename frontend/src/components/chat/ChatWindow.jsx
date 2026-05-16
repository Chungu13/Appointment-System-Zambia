import { useEffect, useRef } from 'react'
import { Bot, X, Sparkles } from 'lucide-react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { useAgentChat } from '../../hooks/useAgentChat'

const QUICK_PROMPTS = [
  'What services do you offer?',
  'Book me an appointment',
  'What are your prices?',
  'Do you have anything this weekend?',
]

export default function ChatWindow({ customerPhone, onClose, salonName }) {
  const { messages, sendMessage, loading } = useAgentChat(customerPhone)
  const bottomRef = useRef(null)
  const showPrompts = messages.length === 1 && !loading

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-[480px] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '600px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary shrink-0">
        <div className="w-9 h-9 bg-on-primary/20 rounded-full flex items-center justify-center shrink-0">
          <Bot size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{salonName || 'Booking Assistant'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <p className="text-xs opacity-90">AI Booking Assistant · Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
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

        {/* Quick prompts — shown only when conversation just started */}
        {showPrompts && (
          <div className="pt-2">
            <p className="text-xs text-on-surface-variant mb-2.5 flex items-center gap-1">
              <Sparkles size={11} />
              Try asking
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/5 transition-colors"
                >
                  {prompt}
                </button>
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
