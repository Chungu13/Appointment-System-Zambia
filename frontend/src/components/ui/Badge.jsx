const colors = {
  green:   { backgroundColor: '#D1FAE5', color: '#065F46' },
  yellow:  { backgroundColor: '#FEF3C7', color: '#92400E' },
  red:     { backgroundColor: '#FEE2E2', color: '#991B1B' },
  blue:    { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  gray:    { backgroundColor: '#F3F4F6', color: '#6B7280' },
  purple:  { backgroundColor: '#F0E5D5', color: '#3B2A1E' },
  primary: { backgroundColor: '#F0E5D5', color: '#3B2A1E' },
}

const statusMap = {
  pending:     'yellow',
  confirmed:   'blue',
  in_progress: 'purple',
  completed:   'green',
  cancelled:   'red',
  no_show:     'gray',
  open:        'green',
  closed:      'gray',
}

export default function Badge({ color, status, className = '', children }) {
  const key = color ?? statusMap[status] ?? 'gray'
  const style = colors[key] ?? colors.gray
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 300,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 0,
        ...style,
      }}
    >
      {children ?? status}
    </span>
  )
}
