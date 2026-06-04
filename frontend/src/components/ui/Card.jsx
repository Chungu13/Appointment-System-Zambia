export default function Card({ className = '', children, padding = true, style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #E8D8DC',
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(107,39,55,0.04)',
        ...(padding ? { padding: 20 } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }) {
  return (
    <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 400, color: '#1A0A0D', margin: 0 }} className={className}>
      {children}
    </h2>
  )
}
