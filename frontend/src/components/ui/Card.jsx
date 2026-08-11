export default function Card({ className = '', children, padding = true, style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #EDE3D6',
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(59,42,30,0.04)',
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
    <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 500, color: '#241812', margin: 0 }} className={className}>
      {children}
    </h2>
  )
}
