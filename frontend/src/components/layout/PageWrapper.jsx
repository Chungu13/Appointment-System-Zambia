import { classNames } from '../../lib/utils'

export default function PageWrapper({ children, className = '', maxWidth = '5xl' }) {
  const widths = {
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  }
  return (
    <main
      className={classNames(
        'mx-auto px-4 py-8 pb-24 sm:pb-8',
        widths[maxWidth] ?? widths['5xl'],
        className
      )}
    >
      {children}
    </main>
  )
}

export function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={classNames('flex items-start justify-between gap-4 mb-8', className)}>
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 400, color: '#1A0A0D', margin: 0, lineHeight: 1.15 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: '#6B4A50', fontSize: 14, marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
