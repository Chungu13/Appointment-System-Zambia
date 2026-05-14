import { MapPin, ChevronRight, Phone } from 'lucide-react'
import Badge from '../ui/Badge'
import { getInitials } from '../../lib/utils'

const TYPE_LABELS = {
  salon: 'Salon',
  barbershop: 'Barbershop',
  nail_tech: 'Nail Tech',
  spa: 'Spa',
}

function salonUrl(subdomain) {
  const { protocol, port } = window.location
  return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ''}`
}

export default function SalonCard({ salon }) {
  const initials = getInitials(salon.businessName)
  return (
    <a
      href={salonUrl(salon.subdomain)}
      className="group block bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <div className="h-36 bg-primary-container flex items-center justify-center">
        <span className="font-display text-5xl font-bold text-on-primary-container select-none">
          {initials}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-on-surface text-sm leading-tight group-hover:text-primary transition-colors">
            {salon.businessName}
          </h3>
          <Badge color="primary" className="shrink-0">
            {TYPE_LABELS[salon.businessType] ?? salon.businessType}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
          <MapPin size={11} className="shrink-0" />
          {salon.city}{salon.address ? ` · ${salon.address}` : ''}
        </div>
        {salon.phone && (
          <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
            <Phone size={11} className="shrink-0" />
            {salon.phone}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          <span className="text-sm font-medium text-primary">Book now</span>
          <ChevronRight size={15} className="text-primary" />
        </div>
      </div>
    </a>
  )
}
