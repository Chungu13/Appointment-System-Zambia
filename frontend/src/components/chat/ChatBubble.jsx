export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-chat-fade-in">
        <div
          className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl rounded-br-sm text-white whitespace-pre-wrap"
          style={{ background: '#3B2A1E' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start animate-chat-fade-in">
      <div
        className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl rounded-bl-sm whitespace-pre-wrap"
        style={{
          background: '#ffffff',
          color: '#241812',
          borderLeft: '3px solid #3B2A1E',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
