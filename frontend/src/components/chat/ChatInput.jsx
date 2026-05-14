import { useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!value.trim() || loading) return
    onSend(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 p-3 border-t border-outline-variant">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message…"
        disabled={loading}
        className="flex-1 rounded-xl border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </form>
  )
}
