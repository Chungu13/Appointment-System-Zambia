export function formatZMW(amount) {
  if (amount == null) return '-'
  return `ZMW ${Number(amount).toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-ZM', {
    weekday: opts.weekday ?? 'short',
    month: 'short',
    day: 'numeric',
    year: opts.year ?? undefined,
    ...opts,
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('en-ZM', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} · ${formatTime(dateStr)}`
}

export function toDateInputValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function statusColor(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function getSalonUrl(subdomain) {
  const port = window.location.port || '3000'
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
  return appDomain
    ? `https://${subdomain}.${appDomain}`
    : `http://${subdomain}.localhost:${port}`
}
