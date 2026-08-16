export const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hrs', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '5 hours', value: 300 },
  { label: '6 hours', value: 360 },
  { label: '8 hours', value: 480 },
]

export function formatDuration(minutes) {
  const preset = DURATIONS.find((d) => d.value === minutes)
  if (preset) return preset.label
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr${h !== 1 ? 's' : ''}` : `${h}h ${m}m`
}

export const CATEGORY_CHIPS = {
  nail_tech:   ['Gel Nails', 'Acrylic', 'Manicure', 'Pedicure', 'Nail Art'],
  salon:       ['Box Braids', 'Relaxer', 'Weave', 'Natural Hair', 'Cuts & Styling'],
  barbershop:  ['Haircut', 'Beard Trim', 'Shape Up', 'Fade'],
  spa:         ['Massage', 'Facial', 'Waxing', 'Body Treatment'],
  lash_studio: ['Lash Extensions', 'Lash Lift', 'Brow Tint', 'Brow Lamination'],
  other:       ['Hair', 'Nails', 'Makeup', 'Skin', 'Other'],
}
