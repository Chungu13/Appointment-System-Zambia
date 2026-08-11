import { classNames } from '../../lib/utils'

const inputStyle = (error) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: `1px solid ${error ? '#F87171' : '#EDE3D6'}`,
  borderRadius: 0,
  fontSize: 13,
  color: '#241812',
  backgroundColor: '#fff',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.12s',
})

export default function Input({ label, error, hint, className = '', inputClassName = '', ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: '#5C4C3D' }}>{label}</label>
      )}
      <input
        style={inputStyle(error)}
        className={inputClassName}
        onFocus={(e) => (e.target.style.borderColor = '#3B2A1E')}
        onBlur={(e) => (e.target.style.borderColor = error ? '#F87171' : '#EDE3D6')}
        {...props}
      />
      {error && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#5C4C3D', margin: 0 }}>{hint}</p>}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: '#5C4C3D' }}>{label}</label>
      )}
      <textarea
        rows={3}
        style={{ ...inputStyle(error), resize: 'none' }}
        onFocus={(e) => (e.target.style.borderColor = '#3B2A1E')}
        onBlur={(e) => (e.target.style.borderColor = error ? '#F87171' : '#EDE3D6')}
        {...props}
      />
      {error && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#5C4C3D', margin: 0 }}>{hint}</p>}
    </div>
  )
}
