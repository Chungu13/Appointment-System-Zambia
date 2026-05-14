import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search salons…' }) {
  return (
    <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
      <Search size={16} className="text-on-surface-variant shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-on-surface-variant hover:text-on-surface">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
