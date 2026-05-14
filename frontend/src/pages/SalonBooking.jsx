import { useParams } from 'react-router-dom'

export default function SalonBooking() {
  const { salonSlug } = useParams()

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary mb-2">
        Book an Appointment
      </h1>
      <p className="text-on-surface-variant mb-8">
        Salon: <span className="font-medium text-on-surface">{salonSlug}</span>
      </p>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant text-center py-8">
          Booking flow coming soon.
        </p>
      </div>
    </main>
  )
}
