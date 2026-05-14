import { MapPin, Clock, Star, Search, ChevronRight, Scissors } from 'lucide-react'

const MOCK_SALONS = [
  {
    slug: 'glow-salon',
    name: 'Glow Beauty Studio',
    location: 'Longacres, Lusaka',
    rating: 4.8,
    reviews: 124,
    tags: ['Hair', 'Nails', 'Facials'],
    openNow: true,
    hours: '08:00 – 19:00',
    image: null,
  },
  {
    slug: 'bella-spa',
    name: 'Bella Spa & Wellness',
    location: 'Kabulonga, Lusaka',
    rating: 4.6,
    reviews: 87,
    tags: ['Massage', 'Waxing', 'Nails'],
    openNow: true,
    hours: '09:00 – 20:00',
    image: null,
  },
  {
    slug: 'queens-touch',
    name: "Queen's Touch Salon",
    location: 'Woodlands, Lusaka',
    rating: 4.9,
    reviews: 203,
    tags: ['Hair', 'Braiding', 'Makeup'],
    openNow: false,
    hours: '08:00 – 18:00',
    image: null,
  },
  {
    slug: 'radiance-beauty',
    name: 'Radiance Beauty Bar',
    location: 'Roma, Lusaka',
    rating: 4.7,
    reviews: 56,
    tags: ['Facials', 'Lashes', 'Brows'],
    openNow: true,
    hours: '10:00 – 19:00',
    image: null,
  },
]

function SalonCard({ salon }) {
  const initials = salon.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <a
      href={`/${salon.slug}`}
      className="group block bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Placeholder image / monogram */}
      <div className="h-40 bg-primary-container flex items-center justify-center">
        <span className="font-display text-4xl font-bold text-on-primary-container select-none">
          {initials}
        </span>
      </div>

      <div className="p-5">
        {/* Name + open badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-on-surface text-base leading-tight group-hover:text-primary transition-colors">
            {salon.name}
          </h3>
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
              salon.openNow
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {salon.openNow ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-2">
          <MapPin size={12} />
          {salon.location}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
          <Star size={12} className="fill-tertiary text-tertiary" />
          <span className="font-medium text-on-surface">{salon.rating}</span>
          <span>({salon.reviews} reviews)</span>
          <span className="mx-1">·</span>
          <Clock size={12} />
          {salon.hours}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {salon.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          <span className="text-sm font-medium text-primary">Book now</span>
          <ChevronRight size={16} className="text-primary" />
        </div>
      </div>
    </a>
  )
}

export default function SalonDirectory() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-primary text-on-primary">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors size={32} />
            <span className="font-display text-4xl font-bold">BeautyBook ZM</span>
          </div>
          <p className="text-on-primary/80 text-lg mb-8 max-w-md mx-auto">
            Discover and book top salons and spas across Zambia — instantly.
          </p>

          {/* Search bar */}
          <div className="max-w-lg mx-auto flex items-center gap-2 bg-surface-container-lowest rounded-xl px-4 py-3 shadow-md">
            <Search size={18} className="text-on-surface-variant shrink-0" />
            <input
              type="text"
              placeholder="Search salons, services, or areas…"
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant text-sm outline-none"
            />
          </div>
        </div>
      </header>

      {/* Filter chips */}
      <div className="border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {['All', 'Hair', 'Nails', 'Facials', 'Massage', 'Braiding', 'Makeup', 'Waxing', 'Lashes'].map(
            (cat, i) => (
              <button
                key={cat}
                className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  i === 0
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Salon grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-on-surface">
            Salons near you
          </h2>
          <span className="text-sm text-on-surface-variant">{MOCK_SALONS.length} found</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK_SALONS.map((salon) => (
            <SalonCard key={salon.slug} salon={salon} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant mt-16 py-8 text-center text-sm text-on-surface-variant">
        © {new Date().getFullYear()} BeautyBook ZM · Built for Zambia
      </footer>
    </div>
  )
}
