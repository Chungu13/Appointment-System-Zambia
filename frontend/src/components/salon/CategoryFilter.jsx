import { classNames } from '../../lib/utils'

const CATEGORIES = ['All', 'Salon', 'Spa', 'Barbershop', 'Nail Tech']
const TYPE_MAP = { All: null, Salon: 'salon', Spa: 'spa', Barbershop: 'barbershop', 'Nail Tech': 'nail_tech' }

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(TYPE_MAP[cat])}
          className={classNames(
            'shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap',
            (selected === TYPE_MAP[cat]) || (selected === null && cat === 'All')
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
