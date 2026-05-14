import { classNames } from '../../lib/utils'

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={classNames('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={classNames(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-on-primary rounded-br-sm'
            : 'bg-surface-container text-on-surface rounded-bl-sm'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
