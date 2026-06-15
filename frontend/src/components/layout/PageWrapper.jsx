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
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 300, color: '#1a0a0d', margin: 0, lineHeight: 1.15 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontFamily: "'Inter', sans-serif", color: '#b09090', fontSize: 12, fontWeight: 300, letterSpacing: '0.04em', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
